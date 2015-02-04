/**
 * @file Requester for E-JSON
 * @author treelite(c.xinle@gmail.com)
 */

var inherits = require('saber-lang').inherits;
var Requester = require('./Requester');

var ERROR = {
    DATA: -1, // json解析错误
    ABORT: -2, // 请求 abort
    TIMEOUT: -3,  // 请求超时
    ERROR: -500 // 未知错误
};

function Ejson(options, context) {
    Requester.call(this, options, context);
}

inherits(Ejson, Requester);

Ejson.prototype.handle = function (error, res, data) {
    var resolver = this.resolver;
    if (error) {
        resolver.reject({status: ERROR.ERROR, statusInfo: error});
        return;
    }

    var status = res.status;

    if (status >= 200
        && status < 300
        || status === 304
    ) {
        try {
            res = JSON.parse(data);
            if (!res.status) {
                resolver.fulfill(res.data);
            }
            else {
                resolver.reject(res);
            }
        }
        catch (e) {
            resolver.reject({status: ERROR.DATA, statusInfo: data});
        }
    }
    else {
        resolver.reject({status: -1 * status});
    }
};

Ejson.ERROR = ERROR;

module.exports = Ejson;
