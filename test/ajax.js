/**
 * @file ajax测试用例
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ajax = require('saber-ajax');

    var URL = {
        SLEEP: '/sleep',
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

    function assertRequest(url, options, expectRes) {
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
            if (typeof expectRes == 'function') {
                expect(expectRes(res)).toBeTruthy();
            }
            else {
                expect(res).toEqual(expectRes);
            }
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

        it('同步请求', function () {
            var req = ajax.request(
                URL.ECHO + '?content=hello',
                {
                    async: false
                }
            );

            req.then(function (data) {
                expect(data).toEqual('hello');
            });
        });

        it('abort异步请求', function () {
            var ret;
            var data;
            var req = ajax.request(URL.SLEEP + '?time=1000');

            req.then(
                function (res) {
                    data = res;
                    ret = true;
                },
                function (error) {
                    data = error;
                    ret = true;
                }
            );

            setTimeout(function () {
                req.abort();
            }, 500);

            waitsFor(
                function () {
                    return ret;
                }, 
                '应该正确处理返回数据', 
                TIMEOUT
            );

            runs(function () {
                expect(data).toEqual('abort');
            });
        });

        describe('POST参数序列化', function () {
            it('字符串参数不进行序列化', function () {
                var data = 'content=hello';
                assertRequest(
                    URL.ECHO, 
                    {
                        method: 'POST',
                        data: data
                    },
                    'hello'    
                );
            });

            if (window.FormData) {
                it('FormData参数不进行序列化', function () {
                    var data = new FormData();
                    data.append('content', 'hello');
                    assertRequest(
                        URL.ECHO, 
                        {
                            method: 'POST',
                            data: data
                        },
                        'hello'    
                    );
                });
            }
            else {
                it('当前浏览器不支持FormData，忽略FormData序列化测试', function () {
                    expect(true).toBeTruthy();
                });
            }
        });

        describe('请求头设置', function () {
            it('设置成功', function () {
                assertRequest(
                    URL.INFO,
                    {
                        headers: {
                            'x-custom-name': 'treelite'
                        }
                    },
                    function (res) {
                        res = JSON.parse(res);
                        return res.headers['x-custom-name'] == 'treelite';
                    }
                );
            });
            it('设置不重复', function () {
                assertRequest(
                    URL.INFO,
                    {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    },
                    function (res) {
                        res = JSON.parse(res);
                        return res.headers['x-requested-with'] == 'XMLHttpRequest';
                    }
                );
            });
        });

        describe('超时设置', function () {
            // 先检查浏览器是否支持timeout
            var testXHR = new XMLHttpRequest();
            if (testXHR.timeout !== undefined) {
                it('设置成功', function () {
                    assertRequest(
                        URL.SLEEP + '?time=1000',
                        {
                            timeout: 500
                        },
                        'timeout'
                    );
                });

                it('忽略给同步请求设置的超时', function () {
                    var req = ajax.request(
                        URL.SLEEP + '?time=1000',
                        {
                            async: false,
                            timeout: 500
                        }
                    );

                    req.then(
                        function (res) {
                            expect(true).toBeTruthy();
                        }, 
                        function (error) {
                            expect(error).not.toEqual('timeout');
                        }
                    );
                });
            }
            else {
                it('当前浏览器不支持timeout设置', function () {
                    expect(true).toBeTruthy();
                });
            }
        });

        describe('responseType设置', function () {
            if (window.ArrayBuffer) {
                it('arraybuffer', function () {
                    var data = 'hello';
                    assertRequest(
                        URL.ECHO,
                        {
                            method: 'POST',
                            data: 'content=' + encodeURIComponent(JSON.stringify(data)),
                            responseType: 'arraybuffer'
                        },
                        function (res) {
                            return res instanceof ArrayBuffer;
                        }
                    );
                });
            }
            else {
                it('该浏览器不支持ArrayBuffer, 忽略该测试', function () {
                    expect(true).toBeTruthy();
                });
            }

            it('设置不支持类型以text处理', function () {
                var data = 'hello';
                assertRequest(
                    URL.ECHO,
                    {
                        method: 'POST',
                        data: 'content=' + encodeURIComponent(JSON.stringify(data)),
                        responseType: 'html'
                    },
                    function (res) {
                        return Object.prototype.toString.call(res)
                            == '[object String]';
                    }
                );
            });

        });

        //TODO Progress事件测试
    });
});
