/**
 * @file ejson封装
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ajax = require('./ajax');
    var Resolver = require('saber-promise');

    function request(url, options) {
        var resolver = new Resolver();
        var req = ajax.request(url, options);

        req.then(
            function (res) {
                res = JSON.parse(res);
                if (!res.status) {
                    resolver.fulfill(res.data);
                }
                else {
                    resolver.reject(res);
                }
            }
        );

        return resolver.promise(req);
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

        request: request
    };
});
