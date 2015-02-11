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

    function format(string) {
        string = string.toLowerCase().replace(/-(.)?/g, function ($0, $1) {
            return '-' + $1.toUpperCase();
        });

        return string.charAt(0).toUpperCase()
            + string.substring(1);
    }

    headers = (headers || []).map(function (name) {
        return format(name);
    });

    function normal(obj) {
        var res = {};
        Object.keys(obj).forEach(function (name) {
            res[format(name)] = obj[name];
        });
        return res;
    }

    function finish(req) {
        var orgHeaders = normal(req.res.headers);
        var res = req.expressCtx.res;
        // 透传响应头信息
        headers.forEach(function (name) {
            if (orgHeaders[name]) {
                // 直接覆盖
                res.set(name, orgHeaders[name]);
            }
        });

        me.expressCtx = req.expressCtx;
    }

    me.on('success', finish);
    me.on('fail', finish);
    me.on('before', function (req, options) {
        var newheaders = normal(options.headers || {});
        var orgHeaders = normal(me.expressCtx.req.headers);
        // 透传请求头信息
        headers.forEach(function (name) {
            if (orgHeaders[name]) {
                // 直接覆盖
                newheaders[name] = orgHeaders[name];
            }
        });
        options.headers = newheaders;

        // 将异步请求对应的express请求环境绑定
        req.expressCtx = me.expressCtx;
    });

    return function (req, res, next) {
        me.expressCtx = {req: req, res: res};
        next();
    };
};

module.exports = Context;
