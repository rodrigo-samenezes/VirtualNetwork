import { IP } from "./Types/Ip";

export class DHCP {

    ipsIsFree: {
        [ip: string]: boolean 
    };
    constructor(private hostIp: IP){
        const ipSplit = hostIp.split('.');
        const fixedIpPart = ipSplit.slice(0, 3).join('.');
        this.ipsIsFree = {};
        for (let i = 1; i < 255; i++){
            const ip = [fixedIpPart, i.toString()].join('.');
            this.ipsIsFree[ip] = true;
        }
        this.ipsIsFree[hostIp] = false;
    }

    getIp(): IP {
        for (const ip in this.ipsIsFree) {
            if (this.ipsIsFree[ip]){
                this.ipsIsFree[ip] = false;
                return ip;
            }
        }
    }

    setIpFree(ip: IP): void {
        this.ipsIsFree[ip] = true;
    }
}