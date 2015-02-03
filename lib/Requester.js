/**
 * @file Requester
 * @author treelite(c.xinle@gmail.com)
 */

/* eslint-env node */

var Resolver = require('saber-promise');
var request = require('request').defaults({
    /* eslint-disable fecs-camelcase */
    headers: {'X-Requested-With': 'XMLHttpRequest'}
    /* eslint-enable fecs-camelcase */
});

/**
 * 默认的请求处理函数
 *
 * @const
 * @type {Function}
 */
var DEF_HANDLER = require('./handler/default');

/**
 * 请求响应处理
 * 
 * @param {Function} handler 实际处理函数
 * @param {Object} error 请求错误
 * @param {Object} res 请求响应对象
 * @param {*} data 响应内容
 */
function responseHandler(handler, error, res, data) {
    var resolver = this.resolver;

    if (error) {
        resolver.reject('error');
        return;
    }

    handler(resolver, res, data);
}

/**
 * 请求对象
 *
 * @constructor
 * @param {Object} options 配置参数
 * @param {string} options.url 请求地址
 * @param {string} options.method 请求方法
 * @param {string=} options.data 请求数据
 * @param {Object=} options.headers 请求头信息
 * @param {Function=} options.handler 请求处理函数
 * @param 
 */
function Requester(options) {
    var resolver = this.resolver = new Resolver();
    this.promise = resolver.promise();
    this.url = options.url;
    this.xhr = request(options, responseHandler.bind(this, options.handler || DEF_HANDLER));
}

Requester.prototype.then = function (onFulfill, onReject) {
    return this.promise.then(onFulfill, onReject);
};

Requester.prototype.success = function (success) {
    return this.then(success);
};

Requester.prototype.fail = function (fail) {
    return this.then(null, fail);
};

Requester.prototype.ensure = function (callback) {
    return this.then(callback, callback);
};

Requester.prototype.abort = function () {
    this.xhr.abort();
};

module.exports = Requester;
