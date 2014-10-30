/**
 * @file ajax
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {

    var bind = require('saber-lang/bind');
    var Emitter = require('saber-emitter');

    var exports = {};

    Emitter.mixin(exports);

    var METHOD_GET = 'GET';
    var METHOD_POST = 'POST';

    // responseType枚举类型
    // 默认为text
    // arraybuffer 的支持还不错
    // 其它选项在移动终端上的支持力度较低
    var RESPONSE_TYPE_ENUM = {
        TEXT: 'text',
        ARRAYBUFFER: 'arraybuffer',
        DOCUMENT: 'document',
        BLOB: 'blob',
        JSON: 'json'
    };

    // 默认responseType
    var DEF_RESPONSE_TYPE = RESPONSE_TYPE_ENUM.TEXT;

    /**
     * 查找header定义的字段
     * 忽略大小写（RFC2616 #3.10）
     *
     * @param {Object} headers
     * @param {string} tag
     * @return {Boolean}
     */
    function findHeader(headers, tag) {
        var tags = Object.keys(headers).map(function (tag) {
                return tag.toLowerCase();
            });

        return tags.indexOf(tag.toLowerCase()) >= 0;
    }

    /**
     * 创建请求对象
     *
     * @inner
     * @return {Object}
     */
    function createRequest() {
        return new XMLHttpRequest();
    }

    /**
     * 遍历Object
     *
     * @inner
     * @param {Object} object
     * @param {Function(string,string)} callback
     */
    function each(object, callback) {
        Object.keys(object).forEach(function (key) {
            callback(key, object[key]);
        });
    }

    /**
     * 函数判断
     *
     * @inner
     * @param {Object} value
     * @return {boolean}
     */
    function isFunction(value) {
        return typeof value === 'function';
    }

    /**
     * 字符串判断
     *
     * @inner
     * @param {Object} value
     * @return {boolean}
     */
    function isString(value) {
        return '[object String]'
            === Object.prototype.toString.call(value);
    }

    /**
     * 扩展对象
     *
     * @inner
     * @param {Object} target 目标对象
     * @param {Object} source 源对象
     * @return {Object} 目标对象
     */
    function extend(target, source) {
        each(source, function (key, value) {
            target[key] = value;
        });
        return target;
    }

    /**
     * 根据reponseType获取返回内容
     *
     * @inner
     * @return {*}
     */
    function getResponseData(xhr) {
        var res;
        if (xhr.responseType
            && xhr.responseType !== DEF_RESPONSE_TYPE
        ) {
            res = xhr.response;
        }
        else {
            res = xhr.responseText;
        }

        return res;
    }

    // 事件处理函数
    var eventHandler = {
        // 请求完成事件
        load: function (xhr, resolver) {
            return function () {
                clearXHREvents(xhr);

                var status = xhr.status;

                if (status >= 200
                    && status < 300
                    || status === 304
                ) {
                    resolver.fulfill(getResponseData(xhr));
                }
                else {
                    resolver.reject(status);
                }
            };
        },

        // 请求错误事件
        error: function (xhr, resolver) {
            return function () {
                clearXHREvents(xhr);
                resolver.reject('error');
            };
        },

        // 请求中止事件
        abort: function (xhr, resolver) {
            return function () {
                clearXHREvents(xhr);
                resolver.reject('abort');
            };
        },

        // 请求超时事件
        timeout: function (xhr, resolver) {
            return function () {
                clearXHREvents(xhr);
                resolver.reject('timeout');
            };
        }
    };

    /**
     * 清除事件
     *
     * @inner
     * @param {Object} xhr
     */
    function clearXHREvents(xhr) {
        each(eventHandler, function (key) {
            xhr['on' + key] = null;
        });
    }

    /**
     * 数据请求包装类
     * 结合`XMLHttpRequest`与`Promise`
     *
     * @constructor
     * @param {XMLHttpRequest} xhr
     * @param {Resolver} resolver
     * @param {Object} options 请求配置参数
     */
    function Requester(xhr, resolver, options) {
        this.xhr = xhr;
        this.promise = resolver.promise();
        this.url = options.url;

        this.handleSuccess = false;
        this.handleFail = false;

        // 触发全局事件
        this.then(
            bind(exports.emit, exports, 'success', this),
            bind(exports.emit, exports, 'fail', this)
        );
    }

    /**
     * 添加请求成功，失败处理
     *
     * @public
     * @param {Function} onFulfill 请求成功处理
     * @param {Function} onReject 请求失败处理
     * @return {Promise}
     */
    Requester.prototype.then = function (onFulfill, onReject) {
        this.handleSuccess = this.handleSuccess || !!onFulfill;
        this.handleFail = this.handleFail || !!onReject;
        return this.promise.then(onFulfill, onReject);
    };

    /**
     * 请求成功处理
     *
     * @public
     * @param {Function} success
     * @return {Promise}
     */
    Requester.prototype.success = function (success) {
        this.handleSuccess = true;
        return this.then(success);
    };

    /**
     * 请求失败处理
     *
     * @public
     * @param {Function} fail
     * @return {Promise}
     */
    Requester.prototype.fail = function (fail) {
        this.handleFail = true;
        return this.then(null, fail);
    };

    /**
     * 请求完成处理
     * 无论请求是否成功都会被调用
     *
     * @public
     * @param {Function} callback
     * @return {Promise}
     */
    Requester.prototype.ensure = function (callback) {
        this.handleSuccess = this.handleFail = true;
        return this.then(callback, callback);
    };

    /**
     * 中止请求
     *
     * @public
     */
    Requester.prototype.abort = function () {
        this.xhr.abort();
    };

    /**
     * 获取请求返回的内容
     *
     * @public
     * @return {*}
     */
    Requester.prototype.getData = function () {
        return getResponseData(this.xhr);
    };

    /**
     * 序列化URL参数
     * 并进行encodeURIComponent操作
     * 不支持多层嵌套的Object
     *
     * @inner
     * @param {Object} params
     * @return {string}
     */
    function stringifyParams(params) {
        var res = [];

        params = params || {};
        each(params, function (key, value) {
            if (!Array.isArray(value)) {
                value = [value];
            }
            value.forEach(function (data) {
                res.push(key + '=' + encodeURIComponent(data));
            });
        });

        return res.join('&');
    }

    /**
     * url字符串添加query
     *
     * @inner
     * @param {string} url
     * @param {Object|string} query
     * @return {string}
     */
    function appendQuery(url, query) {
        if (!isString(query)) {
            query = stringifyParams(query);
        }

        url = url.split('#');
        var hash = url[1];
        url = url[0];
        url += url.indexOf('?') >= 0 ? '&' : '?';
        url += query + (hash ? '#' + hash : '');

        return url;
    }

    /**
     * 发起ajax请求
     *
     * @inner
     * @param {string} url
     * @param {Object} options 请求配置项
     * @param {string=} options.method 请求方式，默认为GET
     * @param {string|Object=} options.data 请求参数
     * @param {boolean=} options.stringify 是否自动序列化请求参数，默认为true
     * @param {boolean=} options.async 是否异步请求，默认为true
     * @param {Object=} options.headers 需要额外设置的请求头
     * @param {number=} options.timeout 请求超时时间，单位ms，只有异步请求才有效
     * @param {string=} options.username 用户名
     * @param {string=} options.password 密码
     * @param {string=} options.responseType 返回的数据类型
     * @param {Function=} options.before 请求发起前处理
     * @param {Object|Function=} options.progress 过程处理函数
     * @return {Object} promise对象
     */
    function request(url, options) {
        var xhr = createRequest();
        options = extend({}, options || {});

        if (options.method === METHOD_GET && options.data) {
            url = appendQuery(url, options.data);
            options.data = null;
        }

        xhr.open(
            options.method || METHOD_GET,
            url,
            options.async || true,
            options.username,
            options.password
        );

        // 设置请求头
        var headers = extend(
                options.headers || {},
                {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            );

        var useFormData = window.FormData ? options.data instanceof FormData : false;

        if (options.method === METHOD_POST
            && !findHeader(headers, 'Content-Type')
            && !useFormData
        ) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        each(headers, function (key, value) {
            xhr.setRequestHeader(key, value);
        });

        // 设置返回数据类型
        var responseType;
        if (responseType = options.responseType) {
            xhr.responseType = RESPONSE_TYPE_ENUM[responseType.toUpperCase()]
                                || DEF_RESPONSE_TYPE;
        }

        // 设置超时
        // 暂时不进行兼容性考虑
        // Chrome for Mac 就不支持 >_<
        if (options.async !== false && options.timeout) {
            xhr.timeout = options.timeout;
        }

        // 事件绑定
        var Resolver = require('saber-promise');
        var resolver = new Resolver();
        each(eventHandler, function (key, creator) {
            xhr['on' + key] = creator(xhr, resolver);
        });

        // progress事件处理
        if (options.progress) {
            if (isFunction(options.progress)) {
                xhr.onprogress = options.progress;
            }
            else if (options.progress.upload && xhr.upload) {
                xhr.upload.onprogress = options.progress.upload;
            }
            else if (options.progress.download) {
                xhr.onprogress = options.progress.download;
            }
        }

        if (options.before && isFunction(options.before)) {
            var ret = options.before(xhr, resolver);
            if (ret === false) {
                return new Requester(xhr, resolver, options);
            }
        }

        var data = options.data;
        if (window.FormData && data instanceof FormData) {
            xhr.send(data);
        }
        else if (!isString(data) && options.stringify !== false) {
            xhr.send(stringifyParams(data));
        }
        else {
            xhr.send(data);
        }

        options.url = url;
        return new Requester(xhr, resolver, options);
    }

    /**
     * 发起get异步请求
     *
     * @public
     * @param {string} url
     * @param {Object=} query
     * @return {Requester}
     */
    exports.get = function (url, query) {
        var options = {
            method: METHOD_GET,
            data: query
        };

        return request(url, options);
    };

    /**
     * 发起post异步请求
     *
     * @public
     * @param {string} url
     * @param {string|Object} data
     * @return {Requester}
     */
    exports.post = function (url, data) {
        var options = {
            method: METHOD_POST,
            data: data
        };

        return request(url, options);
    };

    /**
     * 发起请求
     *
     * @public
     * @param {string} url
     * @param {Object} options 请求配置项
     * @param {string=} options.method 请求方式，默认为GET
     * @param {string|Object=} options.data 请求参数
     * @param {boolean=} options.stringify 是否自动序列化请求参数，默认为true
     * @param {boolean=} options.async 是否异步请求，默认为true
     * @param {Object=} options.headers 需要额外设置的请求头
     * @param {number=} options.timeout 请求超时时间，单位ms，只有异步请求才有效
     * @param {string=} options.username 用户名
     * @param {string=} options.password 密码
     * @param {string=} options.responseType 返回的数据类型
     * @param {Object|Function=} options.progress 过程处理函数
     * @return {Requester}
     */
    exports.request = request;

    return exports;
});
