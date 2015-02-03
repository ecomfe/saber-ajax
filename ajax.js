/**
 * @file AJAX for Node
 * @author treelite(c.xinle@gmail.com)
 */

/* eslint-env node */

var querystring = require('querystring');
var Requester = require('./lib/Requester');
var extend = require('saber-lang').extend;
var METHOD_GET = 'GET';
var METHOD_POST = 'POST';

var config = require('./lib/config');

/**
 * url字符串添加query
 *
 * @inner
 * @param {string} url 请求地址
 * @param {Object|string} query 请求参数
 * @return {string}
 */
function appendQuery(url, query) {
    url = url.split('#');
    var hash = url[1];
    url = url[0];
    url += url.indexOf('?') >= 0 ? '&' : '?';
    url += query + (hash ? '#' + hash : '');

    return url;
}

/**
 * 发送请求
 *
 * @param {string} url 请求地址
 * @param {Object=} options 请求配置项
 * @param {string=} options.method 请求方式，默认为`GET`
 * @param {string|Object=} options.data 请求参数
 * @param {boolean} options.stringify 是否自动序列化请求参数，默认为`true`
 * @param {Object=} options.headers 请求头信息
 * @param {number=} options.timeout 超时时间
 * @return {Requester}
 */
function request(url, options) {
    options = options || {};
    var headers = options.headers || {};
    var method = options.method || METHOD_GET;

    if (method === METHOD_POST && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    var data = options.data;
    if (options.stringify !== false) {
        data = querystring.stringify(data || {});
    }

    if (method === METHOD_GET && data) {
        url = appendQuery(url, data);
        data = '';
    }

    if (config.host) {
        url = config.host + url;
    }

    return new Requester({
        handler: config.handler,
        url: url,
        method: method,
        headers: headers,
        body: data
    });
}

// Exports

/**
 * 全局配置
 *
 * @public
 * @param {Object} options 配置项
 * @param {string=} options.host 请求默认的host
 * @param {Function=} options.handler 请求响应处理函数
 */
exports.config = function (options) {
    config = extend(config, options);
};

/**
 * 发送请求
 *
 * @public
 * @param {string} url 请求地址
 * @param {Object=} options 请求配置项
 * @param {string=} options.method 请求方式，默认为`GET`
 * @param {string|Object=} options.data 请求参数
 * @param {boolean} options.stringify 是否自动序列化请求参数，默认为`true`
 * @param {Object=} options.headers 请求头信息
 * @param {number=} options.timeout 超时时间
 */
exports.request = request;

/**
 * 发起get异步请求
 *
 * @public
 * @param {string} url 请求地址
 * @param {Object=} query 查询条件
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
 * @param {string} url 请求地址
 * @param {string|Object} data 请求数据
 * @return {Requester}
 */
exports.post = function (url, data) {
    var options = {
        method: METHOD_POST,
        data: data
    };

    return request(url, options);
};

// 导出默认提供的处理器
exports.handler = {
    'default': require('./lib/handler/default'),
    'ejson': require('./lib/handler/ejson')
};
