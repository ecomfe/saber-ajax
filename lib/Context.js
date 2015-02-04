/**
 * @file 请求执行环境
 * @author treelite(c.xinle@gmail.com)
 */

var inherits = require('saber-lang').inherits;
var Abstract = require('./AbstractContext');

function Context(Requester) {
    Abstract.call(this, Requester);
}

inherits(Context, Abstract);

module.exports = Context;
