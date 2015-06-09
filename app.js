var app = require('express')(),
    http = require('http').Server(app),
    os = require('os'),
    url = require('url'),
    db  = require('./src/db');
    util = require('util'),
    debug = require('debug');

var INFO  = debug('APP:INFO');
var ERROR = debug('APP:ERR');
var WARN  = debug('APP:WARN');

var hostname = os.hostname(), port = 80, server;

var db_path = '../db/goldennuts.db';
db.open(db_path, false);
if(db.status() == false) {
    ERROR("unable to open DB");
    process.exit(1);
}

app.get('/', function (req, res) {
    //console.log("username: %s", req.user);
    res.sendFile(__dirname + '/index.html');
});

app.get('/pages/*', function(req, res) {
    res.sendFile(__dirname + '/pages/' + req.params[0]);
});

app.get('/scripts/*', function(req, res) {
    res.sendFile(__dirname + '/scripts/' + req.params[0]);
});

app.get('/api/get_item_list', function (req, res) {
    console.log("get_item_list --> ");
    db.item_list(function(err, obj) {
        if(err == true) {
            res.writeHead(404, { 'Content-Type': 'plain/text' });
            res.end(obj);
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(obj));
        }
        return;
    });
    return;
});

app.get('/api/add_item', function (req, res) {
    INFO("add_item --> %s", req.query.name);
    db.new_item(req.query.name, function (error, msg) {
        if (error === true) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("could not add " + req.query.name + " to db");
            ERROR("cound not add element " + req.query.name + " to db due to " + msg);
            return;
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end("added item " + req.query.name + " to db");
            INFO("added item " + req.query.name + " to db");
        }
        return;
    });
});

app.get('/api/current_stocks', function (req, res) {
    INFO("get_item_list --> ");
    db.current_stocks(function(err, obj) {
        if(err == true) {
            res.writeHead(404, { 'Content-Type': 'plain/text' });
            ERROR("%s", obj);
            res.end(obj);
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(obj));
        }
        return;
    });
    return;
});

app.get('/api/get_incoming_stock', function (req, res) {
    INFO("get_stock --> %s", req.query.name);
    var obj = {};
    if(typeof req.query.from === 'undefined'||
       typeof req.query.to === 'undefined') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("expected from and to parameters");
    } else {
        obj.from = req.query.from;
        obj.to = req.query.to;
    }
    if (typeof req.query.name !== 'undefined') {
        obj.name = req.query.name;
    }

    if (typeof req.query.summary !== 'undefined') {
        obj.summary = req.query.summary;        
    }
    db.get_stock_details(obj, function (error, rows) {
        if (error === true) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(rows);
            ERROR("cound not get stock details from db due to " + rows);
            return;
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        }
        return;
    });
});

app.get('/api/add_stock', function (req, res) {
    var obj = {};
    INFO("add stock %d gm of %s at Rs %d", req.query.quantity, req.query.name, req.query.price);
    
    obj.name = req.query.name;
    obj.quantity = req.query.quantity;
    obj.price = req.query.price;
    db_logic.new_stock(obj, function (error, msg) {
        if (error === true) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(msg);
            ERROR(msg);
            return;
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(msg);
            INFO("added " + obj.quantity + " of " + req.query.name + " to DB.");
        }
        return;
    });
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
