/**
 * @file Main
 * @author treelite(c.xinle@gmail.com)
 */

var Context = require('./Context');
var Requester = require('./requester/Requester');
var Ejson = require('./requester/Ejson');

// Noraml request
exports = new Context(Requester);
// Request for E-JSON
exports.ejson = new Context(Ejson);

// Export Class for extension
exports.Context = Context;
exports.Requester = Requester;
exports.Ejson = Ejson;

module.exports = exports;
