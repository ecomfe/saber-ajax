/**
 * @file 请求执行上下文 client
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {

    var Abstract = require('./AbstractContext');
    var inherits = require('saber-lang').inherits;

    function Context(Requester) {
        Abstract.call(this, Requester);
    }

    inherits(Context, Abstract);

    return Context;

});
