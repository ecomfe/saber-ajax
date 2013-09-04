/**
 * @file ajax
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {

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
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                callback(key, object[key]);
            }
        }
    }

    /**
     * 函数判断
     *
     * @inner
     * @param {Object} value
     * @return {boolean}
     */
    function isFunction(value) {
        return '[object Function]' 
            == Object.prototype.toString.call(value);
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
            == Object.prototype.toString.call(value);
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

    // 事件处理函数
    var eventHandler = {
        // 请求完成事件
        load: function (xhr, resolver) {
            return function () {
                clearXHREvents(xhr);

                var status = xhr.status;
                if ((status >= 200 && status < 300)
                    || status == 304
                ) {
                    var res;
                    if (xhr.responseType && xhr.responseType !== DEF_RESPONSE_TYPE) {
                        res = xhr.response;
                    }
                    else {
                        res = xhr.responseText;
                    }

                    resolver.fulfill(res);
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
            res.push(key + '=' + encodeURIComponent(value));
        });

        return res.join('&');
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
     * @param {Object|Function=} options.progress 过程处理函数
     * @return {Object} promise对象
     */
    function request(url, options) {
        var xhr = createRequest();
        options = options || {};

        xhr.open(
            options.method || 'GET', 
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

        each(headers, function (key, value) {
            xhr.setRequestHeader(key, value);
        });

        // 设置返回数据类型
        if (options.responseType) {
            xhr.responseType = RESPONSE_TYPE_ENUM[options.responseType.toUpperCase()]
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

        // 包装promise对象
        return resolver.promise({
            // 添加abort方法
            abort: function () {
                xhr.abort();
            }
        });
    }

    return {
        /**
         * 发起get异步请求
         *
         * @public
         * @param {string} url
         * @return {Object} promise对象
         */
        get: function (url) {
            var options = {
                method: 'GET'
            };

            return request(url, options);
        },

        /**
         * 发起post异步请求
         *
         * @public
         * @param {string} url
         * @param {string|Object} url
         * @return {Object} promise对象
         */
        post: function (url, data) {
            var options = {
                method: 'POST',
                data: data
            };

            return request(url, options);
        },

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
         * @return {Object} promise对象
         */
        request: request
    };
});
