import sys
import os
import threading

import network
import model_helper


continue_loop = True


def get_input():
    global continue_loop
    input('Press Enter to exit\n')
    continue_loop = False


def print_packets():
    s = network.create_socket()
    global continue_loop
    while continue_loop:
        pkt = network.sniff_one_pkt(s)
        pkt = network.parse_pkt(pkt)
        network.print_pkt(pkt)


def collect_dataset(filename, anomaly_src_ip):
    if os.path.isfile(filename):
        print(f'{filename} already exists')
        sys.exit()
    line = ','.join(network.ATTR) + '\n'
    try:
        with open(filename, 'w+') as f:
            f.write(line)
    except IOError:
        print('Error while creating file ' + filename)
        sys.exit()

    s = network.create_socket()
    global continue_loop
    collected = 0
    print()
    while continue_loop:
        pkt = network.sniff_one_pkt(s)
        pkt = network.parse_pkt(pkt)
        network.write_pkt(filename, pkt, anomaly_src_ip)
        collected += 1
        print(f'\033[F{collected} packets collected')


def detect_anomalies():
    s = network.create_socket()
    model = model_helper.load_model('/usr/src/app/anomalies/trained_model.h5')
    global continue_loop
    n_all, n_anomalies = 0, 0
    print()
    while continue_loop:
        pkt = network.sniff_one_pkt(s)
        pkt = network.parse_pkt(pkt)
        n_all += 1
        n_anomalies += int(model_helper.is_anomaly(model, pkt))
        print(f'\033[F{n_all} packets found, {n_anomalies} anomalies detected')


def parse_args():
    if len(sys.argv) < 2:
        print('You need to specify subcommand (print, collect <filename> <anomaly source ip>, detect)')
        sys.exit()

    elif sys.argv[1] == 'print':
        print_packets()

    elif sys.argv[1] == 'collect':
        if len(sys.argv) < 4:
            print('Specify filename for dataset and source ip which will be marked as anomaly')
            sys.exit()
        filename = sys.argv[2]
        anomaly_src_ip = sys.argv[3]
        collect_dataset(filename, anomaly_src_ip)

    elif sys.argv[1] == 'detect':
        detect_anomalies()

    else:
        print('Unknown subcommand ' + sys.argv[1])
        sys.exit()


if __name__ == "__main__":
    parse_thread = threading.Thread(target=parse_args)
    input_thread = threading.Thread(target=get_input)
    parse_thread.start()
    input_thread.start()
