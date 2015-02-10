/**
 * @file 请求执行上下文 server
 * @author treelite(c.xinle@gmail.com)
 */

var Abstract = require('./AbstractContext');
var inherits = require('saber-lang').inherits;

function Context(Requester) {
    Abstract.call(this, Requester);
}

inherits(Context, Abstract);

/**
 * exprss中间件
 * 用于透传HTTP Header信息
 *
 * @param {Array.<string>} headers 需要透传的请求头
 * @return {Function}
 */
Context.prototype.express = function (headers) {
    var me = this;

    function finish(req) {
        var orgHeaders = req.res.headers;
        var res = req.expressCtx.res;
        // 透传响应头信息
        headers.forEach(function (name) {
            if (orgHeaders[name]) {
                res.set(name, orgHeaders[name]);
            }
        });

        me.expressCtx = req.expressCtx;
    }

    me.on('success', finish);
    me.on('fail', finish);
    me.on('before', function (req, options) {
        var headers = options.headers || {};
        var orgHeaders = me.expressCtx.req.headers;
        // 透传请求头信息
        headers.forEach(function (name) {
            if (orgHeaders[name]) {
                headers[name] = orgHeaders[name];
            }
        });
        options.headers = headers;

        // 将异步请求对应的express请求环境绑定
        req.expressCtx = me.express;
    });

    return function (req, res, next) {
        me.expressCtx = {req: req, res: res};
        next();
    };
};

module.exports = Context;
