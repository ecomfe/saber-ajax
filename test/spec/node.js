/**
 * @file Node env spec
 * @author treelite(c.xinle@gmail.com)
 */

var ajax = require('../../main');

describe('Node env special test,', function () {

    it('enable "keep-alive"', function (done) {
        ajax.get('/info').then(function (info) {
            info = JSON.parse(info);
            var headers = info.headers;

            expect(headers['connection']).toEqual('keep-alive');
            done();
        });
    });

    it('do not limit the max socket number', function (done) {
        var sendNum = 0;
        var max = 20;

        function finish() {
            if (sendNum >= max) {
                done();
            }
        }
        
        function request() {
            var requester = ajax.get('/sleep?time=500');
            var req = requester.xhr; 

            req.on('socket', function () {
                sendNum++;
            });

            requester.then(finish);
        }

        for (var i = 0; i < max; i++) {
            request();
        }

        setTimeout(function () {
            expect(sendNum).toEqual(max);
        }, 100);

    });

});
