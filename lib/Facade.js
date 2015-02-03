/**
 * @file Facade
 * @author treelite(c.xinle@gmail.com)
 */

var METHOD = require('./const').METHOD;

function Facade(Requester) {
    this.Requester = Requester;
}

Facade.prototype.request = function (url, options) {
    options = options || {};
    options.url = url;
    return new this.Requester(options);
};

Facade.prototype.get = function (url, query) {
    var options = {
        method: METHOD.GET,
        data: query
    };

    return this.request(url, options);
};

Facade.prototype.post = function (url, data) {
    var options = {
        method: METHOD.POST,
        data: data
    };

    return this.request(url, options);
};

module.exports = Facade;
