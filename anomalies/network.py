import struct
import socket
import sys

IP_VALUES = 6
TCP_VALUES = 5
TCP_FLAGS = 9
DATA_VALUES = 1

BUFFER_SIZE = 65565

ATTR = ["version", "ip_length", "ttl", "protocol", "source_ip", "destination_ip",
        "source_port", "destination_port", "seq_num", "ack_num", "tcp_length",
        "ns", "cwr", "ece", "urg", "ack", "psh", "rst", "syn", "fin",
        "data_size",
        "is_anomaly"]
SOURCE_IP_INDEX = 4
ATTR_INDICES = dict((ATTR[i], i) for i in range(len(ATTR)))


def parse_pkt(pkt):
    parsed_pkt = []

    # packet string from tuple
    pkt = pkt[0]

    # IP
    ip_header = pkt[0:20]
    iph = struct.unpack('!BBHHHBBH4s4s', ip_header)

    version_ihl = iph[0]
    version = version_ihl >> 4
    ihl = version_ihl & 0xF

    iph_length = ihl * 4

    ttl = iph[5]
    protocol = iph[6]
    s_addr = socket.inet_ntoa(iph[8])
    d_addr = socket.inet_ntoa(iph[9])

    parsed_pkt.extend((version, ihl, ttl, protocol, s_addr, d_addr))

    # TCP
    tcp_header = pkt[iph_length:iph_length + 20]
    tcph = struct.unpack('!HHLLBBHHH', tcp_header)

    source_port = tcph[0]
    dest_port = tcph[1]
    sequence = tcph[2]
    acknowledgement = tcph[3]
    doff_reserved_ns = tcph[4]
    tcph_length = doff_reserved_ns >> 4

    tcp_flags = tcph[5]
    ns = doff_reserved_ns & 1
    tcp_flags_list = [ns]
    mask = 0b10000000
    for i in range(8):
        tcp_flags_list.append(0 if (mask & tcp_flags) == 0 else 1)
        mask = mask >> 1

    parsed_pkt.extend((source_port, dest_port, sequence, acknowledgement, tcph_length))
    parsed_pkt.extend(tcp_flags_list)

    # Data
    h_size = iph_length + tcph_length * 4
    data_size = len(pkt) - h_size
    # data = pkt[h_size:]

    parsed_pkt.append(data_size)

    return parsed_pkt


def create_socket():
    try:
        return socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
    except socket.error as e:
        print('Socket could not be created:', e)
        sys.exit()


def sniff_one_pkt(s):
    return s.recvfrom(BUFFER_SIZE)


def print_pkt(parsed_pkt):
    start = 0
    print('Version: {} IP Header Length: {} TTL: {} Protocol: {} Source Address: {} Destination Address: {}'
          .format(*parsed_pkt[start:start+IP_VALUES+1]))
    start += IP_VALUES

    print('Source Port: {} Dest Port: {} Sequence Number: {} Acknowledgement: {} TCP header length: {}'
          .format(*parsed_pkt[start:start+TCP_VALUES+1]))
    start += TCP_VALUES

    print('NS:{} CWR:{} ECE:{} URG:{} ACK:{} PSH:{} RST:{} SYN:{} FIN:{}'
          .format(*parsed_pkt[start:start+TCP_FLAGS+1]))
    start += TCP_FLAGS

    print('Data size: {}'
          .format(*parsed_pkt[start:start+DATA_VALUES+1]))
    start += DATA_VALUES


def write_pkt(file, parsed_pkt, anomaly_source_ip):
    line = ",".join(map(str, parsed_pkt))
    label = "anomaly" if parsed_pkt[SOURCE_IP_INDEX] == anomaly_source_ip else "normal"
    line = f"{line},{label}\n"
    with open(file, 'a') as f:
        f.write(line)
