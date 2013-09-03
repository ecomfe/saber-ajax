/**
 * @file ajax测试用例
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ajax = require('saber-ajax');

    var URL = {
        ECHO: '/echo',
        INFO: '/info'
    };

    var TIMEOUT = 3000;

    function assertGet(url, expectRes) {
        var res;
        var ret;
        var request = ajax.get(url);

        request.then(
            function (data) {
                res = data;
                ret = true;
            },
            function (status) {
                res = status;
                ret = true;
            }
        );

        waitsFor(
            function () {
                return ret;
            },
            '应该正确处理返回数据',
            TIMEOUT
        );

        runs(function () {
            expect(res).toEqual(expectRes);
        });
    }

    function assertPost(url, data, expectRes) {
        var res;
        var ret;
        var request = ajax.post(url, data);

        request.then(
            function (data) {
                res = data;
                ret = true;
            },
            function (status) {
                res = status;
                ret = true;
            }
        );

        waitsFor(
            function () {
                return ret;
            },
            '应该正确处理返回数据',
            TIMEOUT
        );

        runs(function () {
            expect(res).toEqual(expectRes);
        });
    }

    function assertRequest(url, options, callback) {
        var res;
        var ret;
        var request = ajax.request(url, options);

        request.then(
            function (data) {
                res = data;
                ret = true;
            },
            function (status) {
                res = status;
                ret = true;
            }
        );

        waitsFor(
            function () {
                return ret;
            },
            '应该正确处理返回数据',
            TIMEOUT
        );

        runs(function () {
            expect(callback(res)).toBeTruthy();
        });
    }

    describe('get', function () {
        describe('各状态码正确响应', function () {
            it('500', function () {
                assertGet(URL.ECHO + '?status=500', 500);
            });
            it('404', function () {
                assertGet(URL.ECHO + '?status=404', 404);
            });
            it('304', function () {
                assertGet(URL.ECHO + '?status=304', '');
            });
            it('200', function () {
                assertGet(URL.ECHO + '?content=hello', 'hello');
            });
        });
    });

    describe('post', function () {
        describe('各状态码正确响应', function () {
            it('500', function () {
                var data = 'status=500';
                assertPost(URL.ECHO, data, 500);
            });
            it('404', function () {
                var data = 'status=404';
                assertPost(URL.ECHO, data, 404);
            });
            it('304', function () {
                var data = 'status=304';
                assertPost(URL.ECHO, data, '');
            });
            it('200', function () {
                var data = 'content=hello';
                assertPost(URL.ECHO, data, 'hello');
            });
        });

        it('自动序列化参数并进行encodeURIComponent处理', function () {
            var data = {content: '中文'};
            assertPost(URL.ECHO, data, '中文');
        });
    });

    describe('request', function () {
        it('默认GET请求', function () {
            assertRequest(URL.INFO, {}, function (res) {
                res = JSON.parse(res);
                return res.method == 'GET';
            });
        });
    });
});
