/**
 * @file Request kernel for server
 * @author treelite(c.xinle@gmail.com);
 */

var request = require('request');
var METHOD = require('../const').METHOD;
var util = require('../util');

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
                res.status = res.statusCode;
            }
            // Hack Timeout
            else if (error.code.toLowerCase().indexOf('timedout') >= 0) {
                timeout = true;
                error = 'timeout';
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
