/**
 * @file Requester kernel (Client)
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {

    var METHOD = require('../const').METHOD;
    var util = require('../util');
    var bind = require('saber-lang').bind;

    // responseType枚举类型
    // 默认为text
    // arraybuffer 的支持还不错
    // 其它选项在移动终端上的支持力度较低
    var RESPONSE_TYPE = {
        TEXT: 'text',
        ARRAYBUFFER: 'arraybuffer',
        DOCUMENT: 'document',
        BLOB: 'blob',
        JSON: 'json'
    };

    // 事件处理函数
    var eventHandler = {
        // 请求完成事件
        load: function (xhr, requester) {
            return function () {
                clearXHREvents(xhr);
                requester.handle(null, xhr, getResponseData(xhr));
            };
        },

        // 请求错误事件
        error: function (xhr, requester) {
            return function () {
                clearXHREvents(xhr);
                requester.handle('error');
            };
        },

        // 请求中止事件
        abort: function (xhr, requester) {
            return function () {
                clearXHREvents(xhr);
                requester.handle('abort');
            };
        },

        // 请求超时事件
        timeout: function (xhr, requester) {
            return function () {
                clearXHREvents(xhr);
                requester.handle('timeout');
            };
        }
    };

    /**
     * 根据reponseType获取返回内容
     *
     * @inner
     * @param {Object} xhr 请求对象
     * @return {*}
     */
    function getResponseData(xhr) {
        var res;
        if (xhr.responseType
            && xhr.responseType !== RESPONSE_TYPE.TEXT
        ) {
            res = xhr.response;
        }
        else {
            res = xhr.responseText;
        }

        return res;
    }

    /**
     * 清除事件
     *
     * @inner
     * @param {Object} xhr 请求对象
     */
    function clearXHREvents(xhr) {
        util.each(eventHandler, function (key) {
            xhr['on' + key] = null;
        });
    }

    function Kernel(options, requester) {
        var xhr = new XMLHttpRequest();

        // 打开链接
        xhr.open(
            options.method,
            options.url,
            options.async || true,
            options.username,
            options.password
        );

        var useFormData = window.FormData ? options.data instanceof FormData : false;

        var headers = options.headers;
        // POST请求处理
        if (options.method === METHOD.POST
            && !util.findHeader(headers, 'Content-Type')
            && !useFormData
        ) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        // 设置请求头
        util.each(headers, function (key, value) {
            xhr.setRequestHeader(key, value);
        });

        // 设置返回数据类型
        var responseType;
        if (responseType = options.responseType) {
            xhr.responseType = RESPONSE_TYPE[responseType.toUpperCase()]
                                || RESPONSE_TYPE.TEXT;
        }

        // 设置超时
        // 暂时不进行兼容性考虑
        // Chrome for Mac 就不支持 >_<
        if (options.async !== false && options.timeout) {
            xhr.timeout = options.timeout;
        }

        // progress事件处理
        if (options.progress) {
            if (typeof options.progress === 'function') {
                xhr.onprogress = options.progress;
            }
            else if (options.progress.upload && xhr.upload) {
                xhr.upload.onprogress = options.progress.upload;
            }
            else if (options.progress.download) {
                xhr.onprogress = options.progress.download;
            }
        }

        // 绑定事件
        util.each(eventHandler, function (key, creator) {
            xhr['on' + key] = creator(xhr, requester);
        });

        // 发送请求
        var data = options.data;
        if (useFormData) {
            xhr.send(data);
        }
        else if (!util.isString(data) && options.stringify !== false) {
            xhr.send(util.stringify(data));
        }
        else {
            xhr.send(data);
        }

        // 绑定全局事件
        requester.promise.then(
            bind(requester.context.emit, requester.context, 'success', requester),
            bind(requester.context.emit, requester.context, 'fail', requester)
        );

        return xhr;
    }

    return Kernel;
});
