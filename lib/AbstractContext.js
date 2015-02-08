/**
 * @file 请求执行环境虚基类
 * @author treelite(c.xinle@gmail.com)
 */

var METHOD = require('./const').METHOD;
var extend = require('saber-lang').extend;

/**
 * 环境对象
 *
 * @constructor
 * @param {Function} Requester 请求对象构造函数
 */
function Context(Requester) {
    this.data = {};
    this.Requester = Requester;
}

/**
 * 环境配置
 *
 * @public
 * @param {Object=} options 配置参数
 * @param {string=} options.host host配置
 */
Context.prototype.config = function (options) {
    this.data = extend(this.data, options);
};

/**
 * 发起请求
 *
 * @public
 * @param {string} url 请求地址
 * @param {Object=} options 请求配置参数
 * @param {Object=} options.header 请求头
 * @param {string|Object=} options.data 请求参数
 * @param {boolean=} options.stringify 是否自动序列化请求参数，默认为`true`
 * @param {boolean=} options.async 是否异步请求，默认为`true`，**Client Only**
 * @param {number=} options.timeout 请求超时时间，单位`ms`，**Async Only**
 * @param {string=} options.responseType 请求返回的数据类型，默认为`text`文本
 * @return {Requester}
 */
Context.prototype.request = function (url, options) {
    options = options || {};
    options.url = url;
    return new this.Requester(options, this);
};

/**
 * 发起异步GET请求
 *
 * @public
 * @param {string} url 请求地址
 * @param {Object=} query 查询条件
 * @return {Requester}
 */
Context.prototype.get = function (url, query) {
    var options = {
        method: METHOD.GET,
        data: query
    };

    return this.request(url, options);
};

/**
 * 发起异步POST请求
 *
 * @public
 * @param {string} url 请求地址
 * @param {Object=} data 请求内容
 * @return {Requester}
 */
Context.prototype.post = function (url, data) {
    var options = {
        method: METHOD.POST,
        data: data
    };

    return this.request(url, options);
};

module.exports = Context;
