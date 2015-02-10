define(function (require, exports, module) {
    /**
     * @file Requester
     * @author treeelite(c.xinle@gmail.com)
     */

    var util = require('../util');
    var Kernel = require('./Kernel');
    var Resolver = require('saber-promise');
    var METHOD = require('../const').METHOD;

    /**
     * 创建uid
     *
     * @inner
     * @return {string}
     */
    function createUID() {
        return Date.now().toString() + Math.floor(Math.random() * 100);
    }


    /**
     * 请求对象
     *
     * @constructor
     * @param {Object} options 配置参数
     * @param {string} options.url 请求地址
     * @param {string} options.method 请求方法
     * @param {string=} options.data 请求数据
     * @param {Object=} options.headers 请求头信息
     * @param {Object} context 执行环境
     */
    function Requester(options, context) {
        options = options || {};
        options.headers = options.headers || {};
        options.method = options.method || METHOD.GET;

        // 添加默认的请求头标示
        options.headers['X-Requested-With'] = 'XMLHttpRequest';

        // 对GET请求进行处理
        // 注意此时由于平台限制没有对POST进行处理（默认请求头与数据处理）
        // 需要在后续Kernel做处理
        var url = options.url;
        var data = options.data;
        if (options.method === METHOD.GET && data) {
            if (options.stringify !== false
                && !util.isString(data)
            ) {
                data = util.stringify(data);
            }
            url = util.append(url, data);
            data = '';
        }
        options.data = data;

        // 请求地址前缀
        var host = context.data.host;
        if (host) {
            url = host + url;
        }
        options.url = url;

        this.uid = createUID();
        this.resolver = new Resolver();
        this.promise = this.resolver.promise();
        this.url = url;
        this.context = context;
        this.handleSuccess = false;
        this.handleFail = false;
        // 发起请求
        this.xhr = new Kernel(options, this);
    }

    /**
     * 请求响应处理
     *
     * @public
     * @param {Object=} error 请求错误信息
     * @param {Object} res 请求响应对象
     * @param {*} data 响应内容
     */
    Requester.prototype.handle = function (error, res, data) {
        var resolver = this.resolver;

        if (error) {
            resolver.reject(error);
            return;
        }

        var status = res.status;

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

    /**
     * 添加请求成功，失败处理
     *
     * @public
     * @param {Function} onFulfill 请求成功处理
     * @param {Function} onReject 请求失败处理
     * @return {Promise}
     */
    Requester.prototype.then = function (onFulfill, onReject) {
        this.handleSuccess = this.handleSuccess || !!onFulfill;
        this.handleFail = this.handleFail || !!onReject;
        return this.promise.then(onFulfill, onReject);
    };

    /**
     * 请求成功处理
     *
     * @public
     * @param {Function} success 请求成功的回调函数
     * @return {Promise}
     */
    Requester.prototype.success = function (success) {
        return this.then(success);
    };

    /**
     * 请求失败处理
     *
     * @public
     * @param {Function} fail 请求失败的回调函数
     * @return {Promise}
     */
    Requester.prototype.fail = function (fail) {
        return this.then(null, fail);
    };

    /**
     * 请求完成处理
     * 无论请求是否成功都会被调用
     *
     * @public
     * @param {Function} callback 请求完成的回调函数
     * @return {Promise}
     */
    Requester.prototype.ensure = function (callback) {
        return this.then(callback, callback);
    };

    /**
     * 中止请求
     *
     * @public
     */
    Requester.prototype.abort = function () {
        this.xhr.abort();
    };

    module.exports = Requester;
});
