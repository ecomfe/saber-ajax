/**
 * @file Request kernel for server
 * @author treelite(c.xinle@gmail.com);
 */

var request = require('request');
var METHOD = require('../const').METHOD;
var util = require('../util');

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
    var timeout = false;
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
                // Hack Timeout
                if (error.code.toLowerCase().indexOf('timedout') >= 0) {
                    timeout = true;
                    error = 'timeout';
                }
            }
            requester.handle(error, res, data);
        }
    );

    // Hack abort
    // abort总是会在timeout之前被触发...
    function abortError() {
        if (!timeout) {
            requester.handle('abort');
        }
    }

    xhr.on('abort', function () {
        process.nextTick(abortError);
    });

    return xhr;
}

module.exports = Kernel;
