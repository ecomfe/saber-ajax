/**
 * @file ejson封装
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ajax = require('./ajax');
    var Resolver = require('saber-promise');
    var extend = require('saber-lang/extend');

    var ERROR = {
        DATA: 1,
        ABORT: 2,
        TIMEOUT: 3,
        ERROR: 4
    };

    function request(url, options) {
        var resolver = new Resolver();
        var req = ajax.request(url, options);

        req.then(
            function (res) {
                try{
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
                if (typeof reason == 'string') {
                    reason = ERROR[reason.toUpperCase()] || ERROR.ERROR;
                }
                resolver.reject({status: reason});
            }
        );

        req.promise = resolver.promise();
        req.handleSuccess = false;
        req.handleFail = false;

        return req;
    }

    return {
        get: function (url) {
            var options = {
                method: 'GET'
            };

            return request(url, options);
        },

        post: function (url, data) {
            var options = {
                method: 'POST',
                data: data
            };

            return request(url, options);
        },

        request: request,

        ERROR: extend({}, ERROR)
    };
});
