import socketio

"""
INSTRUCTIONS:
vn_hostIp = 'localhost' # address of VirtualNetwork server
vn_port = 3000 # port of VirtualNetwork server
app_port = 44444

vn = VirtualNetworkCliente(vn_hostIp, vn_port)
sk = vn.createUdpSocket(app_port)

"""



class VirtualUdpSocket(object):
    def __init__(self, virtualWire, port):
        self.virtualWire = virtualWire
        self.port = port
        self.udps = []
        self.connected = True
    
    def appendUDP(self, udp_pack):
        self.udps.append(udp_pack)

    def sendto(self, data, destination):
        self.virtualWire.sendto(data, destination)
    
    def recvfrom(self, numberOfBytes):
        while len(self.udps) == 0:
            if not self.connected:
                raise Exception('disconnected!!!')
        udp = self.udps.pop(0)
        data = udp['data']
        addr = (udp['origin']['ip'], udp['origin']['port'])
        return data, addr
    
    def close(self):
        self.virtualWire.disconnect()
        


class VirtualNetworkCliente(object):

    def __init__(self, hostIp, port):
        self.sio = socketio.Client()
        self.ip = None

        @self.sio.event(namespace='/virtualwire')
        def connect():
            print('VIRTUAL_WIRE: connection established')

        @self.sio.event(namespace='/virtualwire')
        def dhcp(data):
            print('VIRTUAL_WIRE: IP = "' + data + '"')
            self.ip = data
        
        @self.sio.event(namespace='/virtualwire')
        def udp(udp_pack):
            #print('VIRTUAL_WIRE: Received UDP_PACK from' + udp_pack['origin']['ip'] + str(udp_pack['origin']['port']))
            if self.udpSocket is not None:
                if self.udpSocket.port == udp_pack['destination']['port']:
                    self.udpSocket.appendUDP(udp_pack)

        @self.sio.event(namespace='/virtualwire')
        def disconnect():
            print('VIRTUAL_WIRE: disconnected from server')

        self.sio.connect('http://' + hostIp + ':' + str(port), namespaces=['/virtualwire'])
        while self.ip is None:
            print('waitin ip')
    
    def getMyIp(self):
        return self.ip
    
    def createUdpSocket(self, port):
        self.udpSocket = VirtualUdpSocket(self, port)
        return self.udpSocket
    
    def sendto(self, data, destination):
        pack_data = {
            'origin': {
                'ip': self.ip,
                'port': self.udpSocket.port
            },
            'destination': {
                'ip': destination[0],
                'port': destination[1]
            },
            'data': data
        }
        self.sio.emit('udp', pack_data, namespace='/virtualwire')
    
    def disconnect(self):
        self.sio.disconnect()
