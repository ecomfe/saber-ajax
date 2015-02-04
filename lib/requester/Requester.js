/**
 * @file Requester
 * @author treeelite(c.xinle@gmail.com)
 */

var util = require('../util');
var Kernel = require('./Kernel');
var Resolver = require('saber-promise');
var METHOD = require('../const').METHOD;


/**
 * 请求对象
 *
 * @constructor
 * @param {Object} options 配置参数
 * @param {string} options.url 请求地址
 * @param {string} options.method 请求方法
 * @param {string=} options.data 请求数据
 * @param {Object=} options.headers 请求头信息
 * @param {Object} context 执行环境
 */
function Requester(options, context) {
    options = options || {};
    options.headers = options.headers || {};
    options.method = options.method || METHOD.GET;

    options.headers['X-Requested-With'] = 'XMLHttpRequest';
    if (options.method === METHOD.POST
        && !options.headers['Content-Type']
    ) {
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    var url = options.url;
    var data = options.data;
    if (options.stringify !== false) {
        data = util.stringify(data || {});
    }

    if (options.method === METHOD.GET && data) {
        url = util.append(url, data);
        data = '';
    }
    options.data = data;

    var host = context.data.host;
    if (host) {
        url = host + url;
    }
    options.url = url;

    this.resolver = new Resolver();
    this.promise = this.resolver.promise();
    this.url = url;
    this.context = context;
    this.xhr = new Kernel(options, this);
}

Requester.prototype.handle = function (error, res, data) {
    var resolver = this.resolver;

    if (error) {
        resolver.reject(error);
        return;
    }

    var status = res.status;

    if (status >= 200
        && status < 300
        || status === 304
    ) {
        resolver.fulfill(data);
    }
    else {
        resolver.reject(status);
    }
};

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
