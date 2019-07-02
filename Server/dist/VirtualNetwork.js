"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var DHCP_1 = require("./DHCP");
var hostIp = '192.168.0.1';
var VirtualNetword = (function () {
    function VirtualNetword() {
        this.clients = [];
        this.views = [];
        this.dhcp = new DHCP_1.DHCP(hostIp);
        this.operationMode = 'normal';
        this.listOfUdpPacks = [];
    }
    VirtualNetword.prototype.addView = function (socket) {
        var _this = this;
        this.views.push(socket);
        socket.on('disconnect', function () {
            _this.views.splice(_this.views.indexOf(socket), 1);
        });
        socket.on('clear', function () {
            if (!_this.listOfUdpPacks.find(function (x) { return x.status == 'going'; })) {
                _this.listOfUdpPacks = [];
                _this.views_sendInitialData();
            }
        });
        socket.on('change_mode', function (mode) {
            if (!_this.listOfUdpPacks.find(function (x) { return x.status == 'going'; })) {
                _this.operationMode = mode;
                _this.views_sendInitialData();
            }
        });
        socket.on('set_udp_status', function (index, status) {
            if (_this.operationMode == 'custom') {
                var udp_pack = _this.listOfUdpPacks[index];
                if (status == 'lost') {
                    udp_pack.status = 'lost';
                }
                else if (status == 'delivered') {
                    var destinationIp_1 = udp_pack.destination.ip == '255.255.255.255' ? udp_pack.real : udp_pack.destination.ip;
                    var client = _this.clients.find(function (x) { return x.ip == destinationIp_1; });
                    if (client) {
                        udp_pack.status = 'delivered';
                        client.socket.emit('udp', udp_pack);
                    }
                }
                _this.views_update_udp_pack(index, udp_pack);
            }
        });
        this.views_sendInitialData();
    };
    VirtualNetword.prototype.addCliente = function (socket) {
        var _this = this;
        var newClient = {
            socket: socket,
            ip: this.dhcp.getIp()
        };
        this.clients.push(newClient);
        socket.emit('dhcp', newClient.ip);
        socket.on('disconnect', function () {
            _this.clients.splice(_this.clients.indexOf(newClient), 1);
            _this.dhcp.setIpFree(newClient.ip);
            _this.views_ip_IN_OUT(newClient.ip, 'OUT');
        });
        socket.on('udp', function (udp_pack) {
            _this.udpHandler(udp_pack);
        });
        this.views_ip_IN_OUT(newClient.ip, 'IN');
    };
    VirtualNetword.prototype.udpHandler = function (udp_pack) {
        this.processUdpPack(udp_pack);
    };
    VirtualNetword.prototype.processUdpPack = function (udp_pack) {
        var _this = this;
        if (udp_pack.destination.ip == '255.255.255.255') {
            this.clients.slice().sort(function (_) { return Math.random() - 0.5; }).forEach(function (client) {
                var packToList = __assign({}, udp_pack, { real: client.ip, status: 'going' });
                _this.listOfUdpPacks.push(packToList);
                _this.views_add_udp_pack(packToList);
                if (_this.operationMode != 'custom') {
                    setTimeout(function () {
                        if (_this.operationMode == 'random') {
                            packToList.status = 'delivered';
                        }
                        else {
                            packToList.status = 'delivered';
                        }
                        if (packToList.status == 'delivered') {
                            client.socket.emit('udp', udp_pack);
                        }
                        _this.views_update_udp_pack(_this.listOfUdpPacks.indexOf(packToList), packToList);
                    }, _this.operationMode == 'normal' ? 1 : Math.random() * 3000);
                }
            });
        }
    };
    VirtualNetword.prototype.views_sendInitialData = function () {
        var _this = this;
        this.views.forEach(function (view) { return view.emit('INITIAL', _this.clients.map(function (cliente) { return cliente.ip; }), _this.listOfUdpPacks, _this.operationMode); });
    };
    VirtualNetword.prototype.views_ip_IN_OUT = function (ip, in_out) {
        this.views.forEach(function (view) { return view.emit("IP_" + in_out, ip); });
    };
    VirtualNetword.prototype.views_add_udp_pack = function (udp_pack) {
        this.views.forEach(function (view) { return view.emit('ADD_PACK', udp_pack); });
    };
    VirtualNetword.prototype.views_update_udp_pack = function (index, pack) {
        this.views.forEach(function (view) { return view.emit('UPDATE_PACK', index, pack); });
    };
    return VirtualNetword;
}());
exports.VirtualNetword = VirtualNetword;
//# sourceMappingURL=VirtualNetwork.js.map