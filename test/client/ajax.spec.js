/**
 * @file AJAX test spec for client
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ajax = require('saber-ajax');

    var spec = require('../spec/ajax');

    spec(ajax);
});
