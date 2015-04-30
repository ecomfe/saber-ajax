/**
 * @file Request kernel for server
 * @author treelite(c.xinle@gmail.com);
 */

var METHOD = require('../const').METHOD;
var util = require('../util');
var url = require('url');

/**
 * 默认端口号
 *
 * @const
 * @type {number}
 */
var DEFAULT_PORT = 80;

/**
 * 默认的协议
 *
 * @const
 * @type {string}
 */
var DEFAULT_PROTOCOL = 'http:';

/**
 * 请求客户端
 *
 * @type {Object}
 */
var clients = {
    http: require('http'),
    https: require('https')
};

/**
 * 请求管理对象
 *
 * @type {Object}
 */
var agents = (function () {
    var http = require('http');
    var https = require('https');
    var options = {
        // 默认开启keep-alive
        keepAlive: true,
        // For node under 0.11
        maxSockets: Infinity
    };

    return {
        http: new http.Agent(options),
        https: new https.Agent(options)
    };
})();

/**
 * 协议的默认端口号
 *
 * @const
 * @type {Object}
 */
var DEFAULT_PORTS = {
    http: DEFAULT_PORT,
    https: 443
};

/**
 * 发起请求
 *
 * @inner
 * @param {Object} opts 请求参数
 * @param {Function} callback 回调函数
 * @return {Object}
 */
function request(opts, callback) {
    var uri = url.parse(opts.url);
    var protocol = uri.protocol || DEFAULT_PROTOCOL;
    protocol = protocol.substring(0, protocol.length - 1);

    var options = {
        hostname: uri.hostname,
        port: uri.port || DEFAULT_PORTS[protocol] || DEFAULT_PORT,
        path: uri.path,
        method: opts.method,
        headers: opts.headers,
        agent: agents[protocol]
    };

    var client = clients[protocol];
    var req = client.request(options, function (res) {
        var data = [];

        res.on('data', function (chunk) {
            data.push(chunk);
        });

        res.on('end', function () {
            if (data.length) {
                data = Buffer.concat(data).toString('utf8');
            }
            else {
                data = '';
            }
            callback(null, res, data);
        });
    });

    req.on('error', callback);

    var abort = req.abort;
    if (opts.timeout) {
        setTimeout(
            function () {
                abort.call(req);
                var e = new Error('TIMEOUT');
                e.code = 'timeout';
                callback(e);
            },
            opts.timeout
        );
    }

    // 重载abort方法 提示错误
    req.abort = function () {
        abort.call(this);
        var e = new Error('ABORT');
        e.code = 'abort';
        callback(e);
    };

    req.write(opts.body || '');
    req.end();

    return req;
}

/**
 * 纪录日志
 *
 * @inner
 * @param {Object} requester 请求对象
 * @param {string} level 日志级别
 */
function log(requester, level) {
    var context = requester.context;
    var logger = context.data.logger;
    if (!logger || !logger[level]) {
        return;
    }

    var args = Array.prototype.slice.call(arguments, 2);
    args[0] = 'AJAX-' + requester.uid + ' ' + args[0];
    logger[level].apply(logger, args);
}

/**
 * 请求核心
 *
 * @constructor
 * @param {Object} options 请求参数
 * @param {Requester} requester 请求对象
 */
function Kernel(options, requester) {
    var headers = options.headers;
    // POST请求添加默认的`Content-Type`
    if (options.method === METHOD.POST
        && !util.findHeader(headers, 'Content-Type')
    ) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    var data = options.data;
    if (!util.isString(data) && options.stringify !== false) {
        data = util.stringify(data);
    }

    log(requester, 'info', 'request %s %s %s %s', options.method, options.url, JSON.stringify(headers), data);

    var xhr = request(
        {
            url: options.url,
            method: options.method,
            headers: headers,
            body: data,
            timeout: options.timeout
        },
        function (error, res, data) {
            if (!error) {
                // 与client端兼容
                var status = res.status = res.statusCode;
                var level = status >= 400 ? 'error' : 'info';
                log(requester, level, 'response %s %s\n%s', status, JSON.stringify(res.headers), data);
            }
            else {
                log(requester, 'error', error.stack);
                if (error.code) {
                    error = error.code;
                }
            }
            requester.handle(error, res, data);
        }
    );

    return xhr;
}

module.exports = Kernel;
