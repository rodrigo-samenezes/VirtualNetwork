import * as io from 'socket.io';
import { UDP_Client } from './Interfaces/UDP_Clients';
import { DHCP } from './DHCP';
import { UDP_Package } from './Interfaces/UDP_Package';
import { IP } from './Types/Ip';

const hostIp = '192.168.0.1';

export class VirtualNetword {

    clients: UDP_Client[];
    views: io.Socket[];
    private dhcp: DHCP;
    private operationMode: 'normal' | 'random' | 'custom';

    private listOfUdpPacks: (UDP_Package & { real?: IP, status: string })[];


    constructor() {
        this.clients = [];
        this.views = [];
        this.dhcp = new DHCP(hostIp);
        this.operationMode = 'normal';
        this.listOfUdpPacks = [];
    }

    public addView(socket: io.Socket): void {
        this.views.push(socket);
        socket.on('disconnect', () => {
            this.views.splice(this.views.indexOf(socket), 1);
        });
        socket.on('clear', () => {
            if (!this.listOfUdpPacks.find(x => x.status == 'going')) {
                this.listOfUdpPacks = [];
                this.views_sendInitialData();
            }
        });
        socket.on('change_mode', (mode) => {
            if (!this.listOfUdpPacks.find(x => x.status == 'going')) {
                this.operationMode = mode;
                this.views_sendInitialData();
            }
        });
        socket.on('set_udp_status', (index: number, status: 'lost' | 'delivered') => {
            if (this.operationMode == 'custom') {
                const udp_pack = this.listOfUdpPacks[index];
                if (status == 'lost') {
                    udp_pack.status = 'lost';
                }
                else if (status == 'delivered') {
                    const destinationIp = udp_pack.destination.ip == '255.255.255.255' ? udp_pack.real : udp_pack.destination.ip;
                    const client = this.clients.find(x => x.ip == destinationIp);
                    if (client) {
                        udp_pack.status = 'delivered';
                        client.socket.emit('udp', udp_pack);
                    }
                }
                this.views_update_udp_pack(index, udp_pack);
            }
        });
        this.views_sendInitialData();
    }

    public addCliente(socket: io.Socket): void {
        const newClient = {
            socket: socket,
            ip: this.dhcp.getIp()
        };
        this.clients.push(newClient);

        socket.emit('dhcp', newClient.ip);
        socket.on('disconnect', () => {
            this.clients.splice(this.clients.indexOf(newClient), 1);
            this.dhcp.setIpFree(newClient.ip);
            this.views_ip_IN_OUT(newClient.ip, 'OUT');
        });

        socket.on('udp', (udp_pack: UDP_Package) => {
            this.udpHandler(udp_pack);
        });
        this.views_ip_IN_OUT(newClient.ip, 'IN');

    }

    private udpHandler(udp_pack: UDP_Package): void {
        this.processUdpPack(udp_pack);
    }

    private processUdpPack(udp_pack: UDP_Package): void {
        //if (udp_pack.destination.ip == '255.255.255.255')
        const vetor = udp_pack.destination.ip == '255.255.255.255' ? [...this.clients] : [this.clients.find(x => x.ip == udp_pack.destination.ip)];
        vetor.sort(_ => Math.random() - 0.5).forEach((client) => {
            const packToList = { ...udp_pack, real: client.ip, status: 'going' };
            this.listOfUdpPacks.push(packToList);
            this.views_add_udp_pack(packToList);
            if (this.operationMode != 'custom') {
                setTimeout(() => {
                    if (this.operationMode == 'random') {
                        packToList.status = 'delivered';//Math.random() > 0.6 ? 'lost' : 'delivered';
                    }
                    else {
                        packToList.status = 'delivered';
                    }

                    if (packToList.status == 'delivered') {
                        client.socket.emit('udp', udp_pack);
                    }
                    this.views_update_udp_pack(this.listOfUdpPacks.indexOf(packToList), packToList);
                }, this.operationMode == 'normal' ? 1 : Math.random() * 3000);
            }
        });

        /*
        const toCiente = this.clients.find(x => x.ip == udp_pack.destination.ip);
        if (toCiente) {
            toCiente.socket.emit('udp', udp_pack);
        }*/
    }

    private views_sendInitialData(): void {
        this.views.forEach(
            view => view.emit('INITIAL', this.clients.map(cliente => cliente.ip), this.listOfUdpPacks, this.operationMode
            ));
    }
    private views_ip_IN_OUT(ip: IP, in_out: 'IN' | 'OUT'): void {
        this.views.forEach(view => view.emit(`IP_${in_out}`, ip));
    }
    private views_add_udp_pack(udp_pack: UDP_Package): void {
        this.views.forEach(view => view.emit('ADD_PACK', udp_pack));
    }

    private views_update_udp_pack(index: number, pack: any): void {
        this.views.forEach(view => view.emit('UPDATE_PACK', index, pack));
    }

}