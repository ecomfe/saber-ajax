/**
 * @file 测试服务器
 * @author treelite(c.xinle@gmail.com)
 */

var MIME_TYPES = {
    json : 'application/json',
    js: 'text/javascript',
    html: 'text/html'
};

var IS_SILENT = false;

function log(msg) {
    if (!IS_SILENT) {
        console.log('[Server]' + msg);
    }
}

function extend(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }

    return target;
}

function createResponse(response, data) {
    if (data.headers) {
        for (var key in data.headers) {
            if (data.headers.hasOwnProperty(key)) {
                response.setHeader(key, data.headers[key]);
            }
        }
    }
    if (!response.getHeader('Content-Type')) {
        response.setHeader('Content-Type', 'text/html');
    }
    response.statusCode = data.status || 200;
    response.end(data.content);
}

/**
 * 判断是否是静态文件
 *
 * @inner
 * @param {string} pathname
 * @return {boolean}
 */
function isStatic(pathname) {
    if (pathname.charAt(0) == '/') {
        pathname = pathname.substring(1);
    }
    var path = require('path');
    var fs = require('fs');
    var file = path.resolve(process.cwd(), pathname);

    return fs.existsSync(file);
}

/**
 * 获取静态文件
 *
 * @inner
 * @param {string} pathname
 * @return {Object}
 */
function getStatic(pathname) {
    if (pathname.charAt(0) == '/') {
        pathname = pathname.substring(1);
    }
    var path = require('path');
    var fs = require('fs');
    var file = path.resolve(process.cwd(), pathname);

    return {
        content: fs.readFileSync(file),
        mimetype: MIME_TYPES[path.extname(file).substring(1)] || 'text/html'
    };
}

/**
 * 解析Form-Data数据
 * 简单方式处理
 *
 * @inner
 * @param {string} str 请求参数
 */
function parseFormData(str) {
    var res = {};
    var regexp = new RegExp('Content-Disposition:\\s+form-data;\\s+name="([^"]+)"', 'g');

    var finded;
    var i;
    var dataToken;
    var endToken;
    var token;
    var name;
    while(finded = regexp.exec(str)) {
        name = RegExp.$1;
        dataToken = [];
        endToken = [];
        i = regexp.lastIndex;
        while (i < str.length 
            && (str.charAt(i) == '\r' || str.charAt(i) == '\n')
        ) {
            i++;
        }
        while (i < str.length) {
            token = str.charAt(i);
            dataToken.push(token);
            if (token == '-') {
                endToken.push(token);
            }
            else {
                endToken = [];
            }
            if (endToken.length >= 6) {
                dataToken.splice(
                    dataToken.length - endToken.length, 
                    endToken.length
                );
                dataToken = dataToken.join('').trim();
                if (res[name]) {
                    res[name] = [res[name]];
                    res[name].push(dataToken);
                }
                else {
                    res[name] = dataToken;
                }
                break;
            }
            i++;
        }
    }
    return res;
}

/**
 * 获取POST数据
 * 按文本解析，不支持file
 *
 * @inner
 * @param {Object} request
 * @param {Function(Object)} callback
 */
function getPostData(request, callback) {
    var data = [];

    request.on('data', function (chunk) {
        data.push(chunk);
    });

    request.on('end', function () {
        data = data.join('');
        if (data.indexOf('Content-Disposition: form-data;') >= 0) {
            data = parseFormData(data);
        }
        else {
            data = require('querystring').parse(data);
        }
        callback(data);
    });
}

var actionList = {};

actionList['/sleep'] = function (request, response) {
    var queryString = require('url').parse(request.url, true).query;
    var time = queryString.time || 3000;

    setTimeout(
        function () {
            createResponse(
                response,
                {
                    content: 'sleep '+ time +' ms'
                }
            );
        }, 
        time
    );
};

actionList['/echo'] = function (request, response) {
    var queryString = require('url').parse(request.url, true).query || {};
    if (request.method == 'POST') {
        getPostData(request, function (data) {
            data = extend(queryString, data);
            createResponse(response, {
                content: data.content || '',
                status: data.status || 200
            });
        });
    }
    else {
        createResponse(response, {
            content: queryString.content || '',
            status: queryString.status || 200
        });
    }
};

actionList['/info'] = function (request, response) {
    var queryString = require('url').parse(request.url);
    var querys = require('querystring').parse(queryString);
    var info = {
        method: request.method,
        headers: request.headers,
        url: request.url,
        params: querys
    };

    if (request.method == 'POST') {
        getPostData(request, function (data) {
            info.params = extend(querys, data);
            createResponse(response, {
                content: JSON.stringify(info),
                status: data.status || 200
            });
        });
    }
    else {
        createResponse(response, {
            content: JSON.stringify(info),
            status: querys.status || 200
        });
    }
};

var http = require('http');

var port = process.argv[2] || 8848;

IS_SILENT = process.argv[3] == 'true';

var server = http.createServer();

var urlMgr = require('url');
server.on('request', function (request, response) {
    var url = urlMgr.parse(request.url);
    var pathname = url.pathname;
    log('[Request]' + pathname);
    var action = actionList[pathname];
    if (action) {
        action(request, response);
    }
    else if (isStatic(pathname)) {
        var data = getStatic(pathname);

        response.statusCode = 200;
        response.setHeader('Content-Type', data.mimetype);
        response.end(data.content);
    }
    else {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/html');
        response.end('not found');
    }
});

server.listen(port);
log('server start at ' + port + '...');
