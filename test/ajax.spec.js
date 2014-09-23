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

    function assertGet(done, url, expectSuccessRes, expectFailRes) {
        var request = ajax.get(url);

        request.then(
            function (data) {
                expect(data).toEqual(expectSuccessRes);
                done();
            },
            function (status) {
                expect(status).toEqual(expectFailRes);
                done();
            }
        );
    }

    function assertPost(done, url, data, expectSuccessRes, expectFailRes) {
        var request = ajax.post(url, data);

        request.then(
            function (data) {
                expect(data).toEqual(expectSuccessRes);
                done();
            },
            function (status) {
                expect(status).toEqual(expectFailRes);
                done();
            }
        );
    }

    function assertRequest(done, url, options, expectSuccessRes, expectFailRes) {
        var request = ajax.request(url, options);

        request.then(
            function (data) {
                if (typeof expectSuccessRes == 'function') {
                    expect(expectSuccessRes(data)).toBeTruthy();
                }
                else {
                    expect(data).toEqual(expectSuccessRes);
                }
                done();
            },
            function (status) {
                if (typeof expectSuccessRes == 'function') {
                    expect(expectSuccessRes(status)).toBeTruthy();
                }
                else {
                    expect(status).toEqual(expectFailRes);
                }
                done();
            }
        );
    }

    function isPhantomJS() {
        return navigator.userAgent.indexOf("PhantomJS") > 0;
    }

    describe('get', function () {
        describe('各状态码正确响应', function () {
            if (!isPhantomJS()) {
                it('500', function (done) {
                    assertGet(done, URL.ECHO + '?status=500', null, 500);
                });
                it('404', function (done) {
                    assertGet(done, URL.ECHO + '?status=404', null, 404);
                });
            }
            it('304', function (done) {
                assertGet(done, URL.ECHO + '?status=304', '');
            });
            it('200', function (done) {
                assertGet(done, URL.ECHO + '?content=hello', 'hello');
            });
        });

        it('不默认设置Content-Type', function (done) {
            assertRequest(
                done,
                URL.INFO,
                {},
                function (res) {
                    res = JSON.parse(res);
                    return !res.headers['content-type'];
                }
            );
        });

        it('支持可选的query参数', function (done) {
            var query = {content: '中文'};
            ajax.get(URL.ECHO, query)
                .then(function (data) {
                    expect(data).toEqual(query.content);
                    done();
                });
        });
    });

    describe('post', function () {
        describe('各状态码正确响应', function () {
            if (!isPhantomJS()) {
                it('500', function (done) {
                    var data = 'status=500';
                    assertPost(done, URL.ECHO, data, null, 500);
                });
                it('404', function (done) {
                    var data = 'status=404';
                    assertPost(done, URL.ECHO, data, null, 404);
                });
            }
            it('304', function (done) {
                var data = 'status=304';
                assertPost(done, URL.ECHO, data, '');
            });
            it('200', function (done) {
                var data = 'content=hello';
                assertPost(done, URL.ECHO, data, 'hello');
            });
        });

        it('自动序列化参数并进行encodeURIComponent处理', function (done) {
            var data = {content: '中文'};
            assertPost(done, URL.ECHO, data, '中文');
        });

        it('自动序列化参数支持数组', function (done) {
            var data = {name:['treelte', 'baidu'], age: 10};
            assertRequest(
                done,
                URL.INFO,
                {
                    method: 'POST',
                    data: data
                },
                function (res) {
                    res = JSON.parse(res).params;
                    return true
                        && Object.keys(res).length == Object.keys(data).length
                        && res.name.length == data.name.length
                        && res.name[0] == data.name[0]
                        && res.name[1] == data.name[1]
                        && res.age == data.age
                }
            );
        });

        it('Content-Type默认添加application/x-www-form-urlencoded', function (done) {
            assertRequest(
                done,
                URL.INFO,
                {
                    method: 'POST'
                },
                function (res) {
                    res = JSON.parse(res);
                    return res.headers['content-type'] == 'application/x-www-form-urlencoded';
                }
            );
        });

        if (window.FormData) {
            it('使用FormData时不默认添加`content-type`', function (done) {
                var data = new FormData();
                data.append('name', 'treelite');

                assertRequest(
                    done,
                    URL.INFO,
                    {
                        method: 'POST',
                        data: data
                    },
                    function (res) {
                        res = JSON.parse(res);
                        return !res['content-type'];
                    }
                );
            });
        }

        it('不覆盖已有的Content-Type设置', function (done) {
            assertRequest(
                done,
                URL.INFO,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'utf-8'
                    }
                },
                function (res) {
                    res = JSON.parse(res);
                    return res.headers['content-type'] == 'utf-8';
                }
            );
        });

        it('Content-type的查找忽略大小写', function (done) {
            assertRequest(
                done,
                URL.INFO,
                {
                    method: 'POST',
                    headers: {
                        'content-Type': 'utf-8'
                    }
                },
                function (res) {
                    res = JSON.parse(res);
                    return res.headers['content-type'] == 'utf-8';
                }
            );
        });

    });

    describe('request', function () {
        it('默认GET请求', function (done) {
            assertRequest(done, URL.INFO, {}, function (res) {
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

        it('abort异步请求', function (done) {
            var req = ajax.request(URL.SLEEP + '?time=1000');

            req.then(
                function (res) {
                    expect(res).toEqual('abort');
                    done();
                },
                function (error) {
                    expect(error).toEqual('abort');
                    done();
                }
            );

            setTimeout(function () {
                req.abort();
            }, 500);

        });

        describe('POST参数序列化', function () {
            it('字符串参数不进行序列化', function (done) {
                var data = 'content=hello';
                assertRequest(
                    done,
                    URL.ECHO, 
                    {
                        method: 'POST',
                        data: data
                    },
                    'hello'    
                );
            });

            if (window.FormData) {
                it('FormData参数不进行序列化', function (done) {
                    var data = new FormData();
                    data.append('content', 'hello');
                    assertRequest(
                        done,
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
            it('设置成功', function (done) {
                assertRequest(
                    done,
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
            it('设置不重复', function (done) {
                assertRequest(
                    done,
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
                it('设置成功', function (done) {
                    assertRequest(
                        done,
                        URL.SLEEP + '?time=1000',
                        {
                            timeout: 500
                        },
                        null,
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
                it('arraybuffer', function (done) {
                    var data = 'hello';
                    assertRequest(
                        done,
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

            it('设置不支持类型以text处理', function (done) {
                var data = 'hello';
                assertRequest(
                    done,
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

    describe('Requester', function () {
        it('.success()', function (done) {
            var req = ajax.get(URL.ECHO + '?content=hello');

            req.success(function (data) {
                expect(data).toBe('hello');
                done();
            });
        });

        if (!isPhantomJS()) {
            it('.fail()', function (done) {
                var req = ajax.get(URL.ECHO + '?status=500');

                req.fail(function (status) {
                    expect(status).toBe(500);
                    done();
                });
            });
        }

        it('.ensure()', function (done) {
            var fn = jasmine.createSpy('ensureFn');
            var req1 = ajax.get(URL.ECHO + '?status=200');
            var req2 = ajax.get(URL.ECHO + '?status=500');

            req1.ensure(fn);
            req2.ensure(fn);

            setTimeout(function () {
                expect(fn.calls.count()).toBe(2);
                done();
            }, 300);
        });
    });

    describe('全局事件', function () {
        it('success', function (done) {
            var url = URL.ECHO + '?content=hello';
            var req = ajax.get(url);

            ajax.once('success', function (req) {
                expect(req.url).toBe(url);
                expect(req.getData()).toBe('hello');
                done();
            });
        });

        it('fail', function (done) {
            var url = URL.ECHO + '?status=500';
            var req = ajax.get(url);

            ajax.once('fail', function (req) {
                expect(req.url).toBe(url);
                done();
            });
        });

        it('handleSuccess', function () {
            var url = URL.ECHO + '?content=hello';
            var req = ajax.get(url);

            ajax.once('success', function (req) {
                expect(req.url).toBe(url);
                expect(req.handleSuccess).toBeFalse();
            });

            req = ajax.get(url).success(function () {});

            ajax.once('success', function (req) {
                expect(req.url).toBe(url);
                expect(req.handleSuccess).toBeThury();
            });
        });

        it('handleFail', function () {
            var url = URL.ECHO + '?status=500';
            var req = ajax.get(url);

            ajax.once('fail', function (req) {
                expect(req.url).toBe(url);
                expect(req.handleFail).toBeFalse();
            });

            req = ajax.get(url).fail(function () {});

            ajax.once('fail', function (req) {
                expect(req.url).toBe(url);
                expect(req.handleFail).toBeThury();
            });
        });
    });
});
