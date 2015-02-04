/**
 * @file E-JSON test spec for client
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ajax = require('saber-ajax').ejson;

    var ERROR = require('saber-ajax').Ejson.ERROR;

    var spec = require('../spec/ejson');

    spec(ajax, ERROR);
});
