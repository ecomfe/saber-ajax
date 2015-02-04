/**
 * @file AJAX test spec for server
 * @author treelite(c.xinle@gmail.com)
 */

var ajax = require('../../main');

ajax.config({
    host: 'http://local:8848'
});

global.define = function (specDefine) {
    var spec = specDefine();
    spec(ajax);
};

require('../spec/ajax');
