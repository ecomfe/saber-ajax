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
 * Plugin for Rebas
 *
 * @param {Object} app server
 * @param {Array.<string>=} headers 需要透传的请求头
 */
Context.prototype.rebas = function (app, headers) {
    var me = this;

    // 日志接口设置
    me.config({
        logger: app.logger
    });

    /**
     * 格式化字符串
     * content-type -> Content-Type
     *
     * @inner
     * @param {string} string 字符串
     * @return {string}
     */
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

    /**
     * 统一Header的格式
     *
     * @inner
     * @param {Object} obj Headers
     * @return {Object}
     */
    function normal(obj) {
        var res = {};
        Object.keys(obj).forEach(function (name) {
            res[format(name)] = obj[name];
        });
        return res;
    }

    /**
     * 请求完成的处理函数
     *
     * @inner
     * @param {Object} requester 请求对象
     */
    function finish(requester) {
        var orgHeaders = normal(requester.res.headers);
        // 恢复当前的请求上下文

        var context = requester.ctx;
        if (app.revertContext(context)) {
            // 透传响应头信息
            var res = context.res;
            headers.forEach(function (name) {
                if (orgHeaders[name]) {
                    // 直接覆盖
                    res.set(name, orgHeaders[name]);
                }
            });
        }
        // Dispose
        requester.ctx = context = null;
    }

    me.on('success', finish);
    me.on('fail', finish);
    me.on('before', function (requester, options) {
        var context = app.getContext();
        if (!context) {
            return;
        }

        var newHeaders = normal(options.headers || {});
        var orgHeaders = normal(context.req.headers);
        // 透传请求头信息
        headers.forEach(function (name) {
            if (orgHeaders[name]) {
                // 直接覆盖
                newHeaders[name] = orgHeaders[name];
            }
        });
        options.headers = newHeaders;

        // 保存异步请求对应的express请求上下文
        requester.ctx = context;
    });
};

module.exports = Context;
