/**
 * @file build配置
 * @author edpx-mobile
 */

var c2a = require('c2a');
var cwd = process.cwd();
var fs = require('fs');
var path = require('path');

/**
 * 输入目录
 *
 * @type {string}
 */
exports.input = cwd;

/**
 * 输出目录
 *
 * @type {string}
 */
exports.output = path.resolve(cwd, 'output');

/**
 * 排除文件pattern列表
 *
 * @type {Array}
 */
exports.exclude = [
    'src',
    'node_modules',
    'dep',
    'doc',
    'test',
    'lib/requester/Kernel.js'
];

/**
 * 获取构建processors的方法
 *
 * @return {Array}
 */
exports.getProcessors = function () {
    return [{
        files: ['lib/*.js', 'lib/*/*.js'],
        name: 'AMD wrap',
        from: 'lib/',
        to: 'src/',
        process: function (file, context, callback) {
            file.outputPath = '../' + file.path.replace(this.from, this.to);
            file.setData(c2a(file.data) + '\n');
            callback();
        }
    }];
};

/**
 * builder主模块注入processor构造器的方法
 *
 * @param {Object} processors
 */
exports.injectProcessor = function (processors) {
    for (var key in processors) {
        global[ key ] = processors[ key ];
    }
};
