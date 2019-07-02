"use strict";
exports.__esModule = true;
var express = require("express");
var http = require("http");
var io = require("socket.io");
var VirtualNetwork_1 = require("./VirtualNetwork");
var App = (function () {
    function App() {
        this.expressApp = express();
        this.http = http.createServer(this.expressApp);
        this.io = io(this.http);
        this.virtualNetwork = new VirtualNetwork_1.VirtualNetword();
    }
    App.prototype.start = function () {
        var _this = this;
        this.expressApp.use(express.static(__dirname + '/html'));
        this.io.of('/virtualwire').on('connection', function (socket) {
            console.log('a user connected: ', socket.client.id);
            socket.on('disconnect', function () {
                console.log(socket.id, 'disconetec');
            });
            _this.virtualNetwork.addCliente(socket);
        });
        this.io.of('/view').on('connection', function (socket) { return _this.virtualNetwork.addView(socket); });
        this.http.listen(process.env.PORT_INDEX || 3000, function () {
            console.log('listening on *:', process.env.PORT_INDEX || 3000);
        });
    };
    return App;
}());
exports.App = App;
//# sourceMappingURL=App.js.map