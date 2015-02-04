/**
 * @file AJAX test spec for server
 * @author treelite(c.xinle@gmail.com)
 */

var ajax = require('../../main').ejson;
var ERROR = require('../../main').Ejson.ERROR;

ajax.config({
    host: 'http://local:8848'
});

global.define = function (specDefine) {
    var spec = specDefine();
    spec(ajax, ERROR);
};

require('../spec/ejson');
