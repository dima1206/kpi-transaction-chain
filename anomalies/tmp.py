from keras.models import load_model
loaded_model = load_model('trained_model_12.h5')

import numpy as np

def check(x):
  if loaded_model(x)[0][0] > 0.5:
    print('anomaly detected')
  else:
    print('packet is normal')

x1 = np.array([[1,-0.4,-1,1,1,-1,-1,-0.98,-1,-1,1,-1]])  # normal
x2 = np.array([[0.375,-1,1,-1,1,-1,1,-1,-1,-1,-1,1]])    # anomaly

check(x1)
check(x2)

x = np.array([[1.0, 0.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0]])  # smb scan
check(x)

# smbclient -L 192.168.11.21
# nmap -sX 192.168.11.21
# nmap -sN 192.168.11.21
# nmap -sF 192.168.11.21