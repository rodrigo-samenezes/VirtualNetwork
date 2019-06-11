import * as io from 'socket.io';
import { IP } from '../Types/Ip';

export interface UDP_Client {
    ip: IP,
    socket: io.Socket
}