/**
 * @file Request kernel for server
 * @author treelite(c.xinle@gmail.com);
 */

var request = require('request');

/**
 * 请求核心
 *
 * @constructor
 * @param {Object} options 请求参数
 * @param {Requester} requester 请求对象
 */
function Kernel(options, requester) {
    return request(
        {
            url: options.url,
            method: options.method,
            headers: options.headers,
            body: options.data
        },
        function (error, res, data) {
            // 与client端兼容
            res.status = res.statusCode;
            requester.handle(error, res, data);
        }
    );
}

module.exports = Kernel;
