import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import keras
import numpy as np

from network import ATTR_INDICES as IND
from network import ATTR


DROP_COLUMNS = ['source_ip', 'destination_ip', 'source_port', 'destination_port', 'seq_num', 'ack_num',
                'version', 'ip_length', 'protocol', 'ns', 'cwr', 'ece', 'rst']


def load_model(filename):
    return keras.models.load_model(filename)


def preprocess_packet(parsed_packet):
    is_local = 1 \
        if(parsed_packet[IND["source_ip"]] == '127.0.0.1'
           or parsed_packet[IND["destination_ip"]] == '127.0.0.1') \
        else -1
    is_src_3000 = 1 if parsed_packet[IND["source_port"]] == 3000 else -1
    is_dst_3000 = 1 if parsed_packet[IND["destination_port"]] == 3000 else -1
    is_ack_0 = 1 if parsed_packet[IND["ack_num"]] == 0 else -1

    parsed_packet[IND['ttl']] = parsed_packet[IND['ttl']] / 32.0 - 1
    parsed_packet[IND['tcp_length']] = (parsed_packet[IND['tcp_length']] - 10.0) / 5.0
    parsed_packet[IND['urg']] = parsed_packet[IND['urg']] * 2 - 1
    parsed_packet[IND['ack']] = parsed_packet[IND['ack']] * 2 - 1
    parsed_packet[IND['psh']] = parsed_packet[IND['psh']] * 2 - 1
    parsed_packet[IND['syn']] = parsed_packet[IND['syn']] * 2 - 1
    parsed_packet[IND['fin']] = parsed_packet[IND['fin']] * 2 - 1
    parsed_packet[IND['data_size']] = parsed_packet[IND['data_size']] / 845.0 * 2.0 - 1.0

    x = list(parsed_packet[i] for i in range(len(parsed_packet)) if ATTR[i] not in DROP_COLUMNS)
    x.extend((is_local, is_src_3000, is_dst_3000, is_ack_0))
    return np.array([x, ])


def is_anomaly(model, parsed_packet):
    x = preprocess_packet(parsed_packet)
    guess = int(model(x)[0][0])
    print(f'g:{guess}, l:{x.tolist()}')
    return guess > 0.5
