import { IP } from "../Types/Ip";

export interface UDP_Package {
    origin: {
        ip: IP,
        port: number
    },
    destination: {
        ip: IP,
        port: number
    },
    data: any;
}