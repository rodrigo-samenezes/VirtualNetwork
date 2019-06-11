import * as express from 'express';
import * as http from 'http';
import * as io from 'socket.io';
import { VirtualNetword } from './VirtualNetwork';

export class App {
    private expressApp: express.Application;
    private http: http.Server;
    private io: io.Server;
    private virtualNetwork: VirtualNetword;

    constructor() {
        this.expressApp = express();
        this.http = http.createServer(this.expressApp);
        this.io = io(this.http);
        this.virtualNetwork = new VirtualNetword();
    }

    public start() {
        this.expressApp.use(express.static(__dirname + '/html'));

        this.io.of('/virtualwire').on('connection', (socket: io.Socket) => {
            console.log('a user connected: ', socket.client.id);
            socket.on('disconnect', () => {
                console.log(socket.id, 'disconetec')
            });
            this.virtualNetwork.addCliente(socket);
        });

        this.io.of('/view').on('connection', (socket) => this.virtualNetwork.addView(socket));

        this.http.listen(3000, function () {
            console.log('listening on *:3000');
        });
    }
}