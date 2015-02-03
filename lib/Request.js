/**
 * @file Request
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
 * 处理请求响应
 *
 * @inner
 * @param {Object} error 错误信息
 * @param {Object} res 请求响应对象
 * @param {*} data 请求响应数据
 */
function handleResponse(error, res, data) {
    var resolver = this.resolver;
    if (error) {
        resolver.reject('error');
        return;
    }

    var status = res.statusCode;
    if (status >= 200
        && status < 300
        || status === 304
    ) {
        resolver.resolve(data);
    }
    else {
        resolver.reject(status);
    }
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
 */
function Request(options) {
    var resolver = this.resolver = new Resolver();
    this.promise = resolver.promise();
    this.url = options.url;
    this.xhr = request(options, handleResponse.bind(this));
}

Request.prototype.then = function (onFulfill, onReject) {
    return this.promise.then(onFulfill, onReject);
};

Request.prototype.success = function (success) {
    return this.then(success);
};

Request.prototype.fail = function (fail) {
    return this.then(null, fail);
};

Request.prototype.ensure = function (callback) {
    return this.then(callback, callback);
};

Request.prototype.abort = function () {
    this.xhr.abort();
};

module.exports = Request;
