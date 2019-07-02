"use strict";
exports.__esModule = true;
var DHCP = (function () {
    function DHCP(hostIp) {
        this.hostIp = hostIp;
        var ipSplit = hostIp.split('.');
        var fixedIpPart = ipSplit.slice(0, 3).join('.');
        this.ipsIsFree = {};
        for (var i = 1; i < 255; i++) {
            var ip = [fixedIpPart, i.toString()].join('.');
            this.ipsIsFree[ip] = true;
        }
        this.ipsIsFree[hostIp] = false;
    }
    DHCP.prototype.getIp = function () {
        for (var ip in this.ipsIsFree) {
            if (this.ipsIsFree[ip]) {
                this.ipsIsFree[ip] = false;
                return ip;
            }
        }
    };
    DHCP.prototype.setIpFree = function (ip) {
        this.ipsIsFree[ip] = true;
    };
    return DHCP;
}());
exports.DHCP = DHCP;
//# sourceMappingURL=DHCP.js.map