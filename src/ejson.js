/**
 * @file ejson封装
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ajax = require('./ajax');
    var Resolver = require('saber-promise');
    var bind = require('saber-lang/bind');
    var extend = require('saber-lang/extend');
    var Emitter = require('saber-emitter');

    var ERROR = {
        DATA: -1, // json解析错误
        ABORT: -2, // 请求 abort
        TIMEOUT: -3,  // 请求超时
        ERROR: -500 // 未知错误
    };

    var exports = {};

    Emitter.mixin(exports);

    function request(url, options) {
        var resolver = new Resolver();
        var req = ajax.request(url, options);

        req.then(
            function (res) {
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
            },
            function (reason) {
                if (typeof reason === 'string') {
                    reason = ERROR[reason.toUpperCase()] || ERROR.ERROR;
                }
                resolver.reject({status: reason});
            }
        );

        req.promise = resolver.promise();
        req.promise.then(
            bind(exports.emit, exports, 'success', req),
            bind(exports.emit, exports, 'fail', req)
        );
        req.handleSuccess = false;
        req.handleFail = false;

        return req;
    }

    exports.get = function (url, query) {
        var options = {
            method: 'GET',
            data: query
        };

        return request(url, options);
    };

    exports.post = function (url, data) {
        var options = {
            method: 'POST',
            data: data
        };

        return request(url, options);
    };

    exports.request = request;

    exports.ERROR = extend({}, ERROR);

    return exports;
});
