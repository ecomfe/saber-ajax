define(function (require, exports, module) {
    /**
     * @file Requester for E-JSON
     * @author treelite(c.xinle@gmail.com)
     */

    var util = require('../util');
    var inherits = require('saber-lang').inherits;
    var Requester = require('./Requester');

    /**
     * 错误标示
     *
     * @const
     * @type {Object}
     */
    var ERROR = {
        DATA: -1, // json解析错误
        ABORT: -2, // 请求 abort
        TIMEOUT: -3,  // 请求超时
        ERROR: -500 // 未知错误
    };

    /**
     * EJSON
     *
     * @constructor
     * @param {Object} options 请求参数
     * @param {Object} context 执行环境对象
     */
    function Ejson(options, context) {
        Requester.call(this, options, context);
    }

    inherits(Ejson, Requester);

    /**
     * 请求响应处理
     *
     * @override
     * @param {Object=} error 请求错误信息
     * @param {Object} res 请求响应对象
     * @param {*} data 响应内容
     */
    Ejson.prototype.handle = function (error, res, data) {
        this.res = res;
        var resolver = this.resolver;

        if (error) {
            if (util.isString(error)) {
                resolver.reject({status: ERROR[error.toUpperCase()] || ERROR.ERROR});
            }
            else {
                resolver.reject({status: ERROR.ERROR, statusInfo: error});
            }
            return;
        }

        var status = res.status;

        if (status >= 200
            && status < 300
            || status === 304
        ) {
            try {
                res = JSON.parse(data);
                if (!res.status) {
                    resolver.fulfill(res.data);
                }
                else {
                    resolver.reject(res);
                }
            }
            catch (e) {
                // JSON解析错误
                resolver.reject({status: ERROR.DATA, statusInfo: data});
            }
        }
        else {
            resolver.reject({status: -1 * status});
        }
    };

    Ejson.ERROR = ERROR;

    module.exports = Ejson;
});
