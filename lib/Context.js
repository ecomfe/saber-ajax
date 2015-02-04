/**
 * @file 请求执行环境
 * @author treelite(c.xinle@gmail.com)
 */

var METHOD = require('./const').METHOD;
var extend = require('saber-lang').extend;

function Context(Requester) {
    this.data = {};
    this.Requester = Requester;
}

Context.prototype.config = function (options) {
    this.data = extend(this.data, options);
};

Context.prototype.request = function (url, options) {
    options = options || {};
    options.url = url;
    return new this.Requester(options, this);
};

Context.prototype.get = function (url, query) {
    var options = {
        method: METHOD.GET,
        data: query
    };

    return this.request(url, options);
};

Context.prototype.post = function (url, data) {
    var options = {
        method: METHOD.POST,
        data: data
    };

    return this.request(url, options);
};

module.exports = Context;
