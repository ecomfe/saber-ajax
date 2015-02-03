/**
 * @file Main
 * @author treelite(c.xinle@gmail.com)
 */

var Facade = require('./Facade');
var Requester = require('./requester/Requester');
var Ejson = require('./requester/Ejson');

exports = new Facade(Requester);
exports.ejson = new Facade(Ejson);

// Export Class for extension
exports.Facade = Facade;
exports.Requester = Requester;
exports.Ejson = Ejson;

module.exports = exports;
