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

    return request(
        {
            url: options.url,
            method: options.method,
            headers: headers,
            body: data,
            timeout: options.timeout
        },
        function (error, res, data) {
            // 与client端兼容
            res.status = res.statusCode;
            requester.handle(error, res, data);
        }
    );
}

module.exports = Kernel;
