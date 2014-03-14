var fs = require('fs');
var path = require('path');
var PID_FILE = '.server.pid';

function getServerPID() {
    var pid = 0;

    if (!fs.existsSync(PID_FILE)) {
        return pid;
    }
    
    pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);

    return pid;
}

function setServerPID(pid) {
    fs.writeFileSync(PID_FILE, pid, 'utf-8');
}

var commandHandler = {};

commandHandler.start = function () {
    var port = process.argv[3] || 8848;
    if (!getServerPID()) {
        var child = require('child_process').fork(path.resolve(__dirname, 'server'), [port, true]);
        setServerPID(child.pid);
        child.disconnect();
        console.log('server start on ' + port);
    }
};

commandHandler.stop = function () {
    var pid = getServerPID();

    if (pid) {
        fs.unlinkSync(PID_FILE);
        process.kill(pid, 'SIGKILL');
        console.log('server stop');
    }
};

var cmd = process.argv[2];

var handler = commandHandler[cmd];

if (handler) {
    handler();
}
else {
    console.log(cmd + ' command not found');
}

process.exit(0);
