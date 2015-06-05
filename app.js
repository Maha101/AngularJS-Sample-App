var app = require('express')(),
    http = require('http').Server(app),
    os = require('os'),
    url = require('url'),
    util = require('util');

var hostname = os.hostname();
var port = 80;
var server;


app.get('/', function (req, res) {
    //console.log("username: %s", req.user);
    res.sendFile(__dirname + '/index.html');
});

app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/' + req.params[0]);
});

app.get('/api/get_item_list', function (req, res) {
    console.log("get_item_list --> ");
    
    var json= [{"item_id":1,"name":"cashew","dt":"2015-06-04","tm":"17-22-58"},
               {"item_id":4,"name":"cashew-jh","dt":"2015-06-04","tm":"17-22-58"},
               {"item_id":3,"name":"cashew-round","dt":"2015-06-04","tm":"17-22-58"},
               {"item_id":2,"name":"kiss-miss","dt":"2015-06-04","tm":"17-22-58"},
               {"item_id":5,"name":"pepper","dt":"2015-06-04","tm":"17-22-58"}]

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(json));
    return;
});

server = http.listen(port, function(){
    console.log("listening on http://%s:%d", hostname, port);
});

process.on('SIGTERM', function () {
    http.close(function () {
        process.exit(0);
    });
});

process.on('SIGINT', function () {
    http.close(function () {
        process.exit(0);
    });
});
