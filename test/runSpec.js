/**
 * @file Run test for Node
 * @author treelite(c.xinle@gmail.com)
 */

var loader = require('amder');

var ajax = require('../main');
var ejson = require('../main').ejson;

var options = {
    host: 'http://localhost:8848'
};

ajax.config(options);
ejson.config(options);

loader.config({
    packages: [
        {
            name: 'saber-ajax',
            location: require.resolve('../')
        }
    ]
});

require('./spec/ajax');

require('./spec/ejson');

require('./spec/node');
