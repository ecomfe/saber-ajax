/**
 * @file Util
 * @author treelite(c.xinle@gmail.com)
 */

/**
 * 遍历Object
 *
 * @inner
 * @param {Object} object 对象
 * @param {function(string,string)} callback 回调函数
 */
var each = exports.each = function (object, callback) {
    Object.keys(object).forEach(function (key) {
        callback(key, object[key]);
    });
};

/**
 * 序列化URL参数
 * 并进行encodeURIComponent操作
 * 不支持多层嵌套的Object
 *
 * @inner
 * @param {Object} params 参数
 * @return {string}
 */
exports.stringify = function (params) {
    var res = [];

    params = params || {};
    each(params, function (key, value) {
        if (!Array.isArray(value)) {
            value = [value];
        }
        value.forEach(function (data) {
            res.push(key + '=' + encodeURIComponent(data));
        });
    });

    return res.join('&');
};

/**
 * url字符串添加query
 *
 * @inner
 * @param {string} url 请求地址
 * @param {Object|string} query 请求参数
 * @return {string}
 */
exports.append = function (url, query) {
    url = url.split('#');
    var hash = url[1];
    url = url[0];
    url += url.indexOf('?') >= 0 ? '&' : '?';
    url += query + (hash ? '#' + hash : '');

    return url;
};
