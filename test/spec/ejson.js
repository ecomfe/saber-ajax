/**
 * @file GET test spec
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {

    var ajax = require('saber-ajax').ejson;
    var ERROR = require('saber-ajax').Ejson.ERROR;

    var URL = {
        SLEEP: '/sleep',
        ECHO: '/echo',
        INFO: '/info'
    };

    describe('E-JSON', function () { 
        
        it('parse json fail', function (done) {
            ajax.get(URL.ECHO, {content: 'error'}).then(null, function (res) {
                expect(res.status).toBe(ERROR.DATA);
                done();
            });
        });

        it('status === 0', function (done) {
            var res = {status: 0, data: "hello"};

            ajax.get(URL.ECHO, {content: JSON.stringify(res)}).then(
                function (data) {
                    expect(data).toEqual(res.data);
                    done();
                }
            );
        });

        it('status !== 0', function (done) {
            var res = {status: 1, statusInfo: "error"};

            ajax.get(URL.ECHO, {content: JSON.stringify(res)}).then(null, function (r) {
                expect(r.status).toEqual(res.status);
                expect(res.statusInfo).toEqual(r.statusInfo);
                done();
            });
        });

        it('abort error', function (done) {
            var req = ajax.get(URL.SLEEP, {time: 1000});

            req.then(null, function (res) {
                expect(res.status).toEqual(ERROR.ABORT);
                done();
            });

            setTimeout(function () {
                req.abort();
            }, 200);
        });


        var isNode = typeof process !== 'undefined';
        var testXHR;
        if (typeof XMLHttpRequest !== 'undefined') {
            testXHR = new XMLHttpRequest();
        }
        else {
            testXHR = {};
        }

        // Node平台或者支持timeout的客户端才进行此测试
        if (isNode || typeof testXHR.timeout !== 'undefined') {
            it('timeout error', function (done) {
                ajax.request(URL.SLEEP + '?time=1000', {timeout: 200}).then(null, function (res) {
                    expect(res.status).toEqual(ERROR.TIMEOUT);
                    done();
                });
            });
        }

    });

});
