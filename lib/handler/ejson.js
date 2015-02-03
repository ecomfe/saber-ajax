/**
 * @file E-JSON handler
 * @author treelite(c.xinle@gmail.com)
 */

var ERROR = {
    DATA: -1 // json解析错误
};

var handler = require('./default');

module.exports = function (resolver, res, data) {
    var fn = {};

    fn.fulfill = function (res) {
        try {
            res = JSON.parse(res);
            if (!res.status) {
                resolver.fulfill(res.data);
            }
            else {
                resolver.reject(res);
            }
        }
        catch (e) {
            resolver.reject({status: ERROR.DATA});
        }
    };

    fn.reject = function (status) {
        resolver.reject({status: -1 * status});
    };

    handler(fn, res, data);
};
