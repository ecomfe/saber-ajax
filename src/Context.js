/**
 * @file 请求执行环境(Client)
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {

    var inherits = require('saber-lang').inherits;
    var Abstract = require('./AbstractContext');
    var Emitter = require('saber-emitter');

    function Context(Requester) {
        Abstract.call(this, Requester);
        // 添加事件机制
        Emitter.mixin(this);
    }

    inherits(Context, Abstract);

    return Context;
});
