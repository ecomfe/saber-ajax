/**
 * @file Default handler
 * @author treelite(c.xinle@gmail.com)
 */

module.exports = function (resolver, res, data) {
    var status = res.statusCode;

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
