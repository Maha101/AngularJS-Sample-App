var app = require('express')(),
    http = require('http').Server(app),
    bodyParser = require('body-parser');
        
var db = require('./src/db'), 
    mail = require('./src/send_mail'),
    moment = require('moment');

var debug = require('debug'),
    events = require('events'),
    util = require('util');

var INFO  = debug('APP:INFO');
var ERROR = debug('APP:ERR');
var WARN  = debug('APP:WARN');

var hostname = require('os').hostname(), port = 80, server;

var db_path = '../db/goldennuts.db';
db.open(db_path, false);
if(db.status() == false) {
    ERROR("unable to open DB");
    process.exit(1);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     
    extended: true
}));

app.get('/', function (req, res) {
    //console.log("username: %s", req.user);
    res.sendFile(__dirname + '/index.html');
});

app.get('/pages/*', function(req, res) {
    res.sendFile(__dirname + '/html_pages/' + req.params[0]);
});

app.get('/scripts/*', function (req, res) {    
    res.sendFile(__dirname + '/downloaded_scripts/' + req.params[0]);
});

app.get('/api/get_item_list', function (req, res) {
    INFO("get_item_list --> ");
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

app.get('/api/get_outgoing_stock', function (req, res) {
    INFO("get_sales_details --> %s", req.query.name);
    var obj = {};
    if (typeof req.query.from === 'undefined' ||
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
    db.get_sales_details(obj, function (error, rows) {
        if (error === true) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(rows);
            ERROR("cound not get sales details from db due to " + rows);
            return;
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        }
        return;
    });
});

var eventEmitter = new events.EventEmitter();
eventEmitter.setMaxListeners(1);

app.post('/api/add_stock', function (req, res) {
    var obj = {};
    INFO("%s", JSON.stringify(req.body));
    var failed_list = "";
    var obj = req.body;
    var count = -1;
       
    eventEmitter.on('next_item', function () {
        count++;
        if (count < obj.length) {
            obj[count].quantity *= 1000;
            INFO("Inserting Stock %s -> Q: %d -> P: %d", obj[count].name, obj[count].quantity, obj[count].price);
            db.add_stock(obj[count], function (error, msg) {
                if (error === true) {
                    failed_list = failed_list + (failed_list == "" ?  "" : ",") + obj[count].name;
                }
                eventEmitter.emit("next_item");
                return;
            });
        } else {
            eventEmitter.removeAllListeners('next_item');

            if (failed_list == "") {
                INFO("inserted all the elemented to DB");
                res.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                res.end("kiran");
            } else {
                ERROR("Failed to insert items : %s", failed_list);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(failed_list);                
            }
        }
    });
    eventEmitter.emit("next_item");    
});

app.post('/api/sell_stock', function (req, res) {
    var obj = {};
    INFO("%s", JSON.stringify(req.body));
    var failed_list = "";
    var sell_obj = req.body;
    var obj = sell_obj.items;
    var bill = sell_obj.bill;
    var count = -1;
    eventEmitter.on('next_item', function () {
        count++;
        if (count < obj.length) {
            obj[count].quantity *= 1000;
            obj[count].transaction_type = bill.reason;
            obj[count].reason = util.format("bill%s,%s", bill.billno, bill.comment);
            INFO("Inserting Stock %s -> Q: %d -> P: %d", obj[count].name, obj[count].quantity, obj[count].price);
            db.sell_stock(obj[count], function (error, msg) {
                if (error === true) {
                    failed_list = failed_list + (failed_list == "" ?  "" : ",") + obj[count].name;
                }
                eventEmitter.emit("next_item");
                return;
            });
        } else {
            eventEmitter.removeAllListeners('next_item');
            
            if (failed_list == "") {
                INFO("inserted all the elemented to DB");
                res.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
                res.end("kiran");
            } else {
                ERROR("Failed to insert items : %s", failed_list);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(failed_list);
            }
        }
    });
    eventEmitter.emit("next_item");
});

function sendDailyReport() {
    var count = 0;
    var current_stocks, incoming_stocks, outgoing_stocks;
    eventEmitter.on('done', function () {
        count++;
        if(3 !== count) {
            INFO("Got partial Data");
            return;
        }

        INFO("Got all data. NOw send email");
        eventEmitter.removeAllListeners('done');
        var html_text = "<html><head><title>Daily Report</title></head><body>";
        html_text = "<table border='1'><tr><th>Current Stocks</th><th>Incoming Stocks </th> <th> Outgoing Stocks</th></tr><td>";
        var i = 0;
        html_text += "<table border='1'><thead><tr><th>Item Name</th><th>Quantity</th></tr></thead><tbody>";        
        for(i = 0; i < current_stocks.length; i++) {
            if(current_stocks[i].quantity > 1) {
                html_text += "<tr>"; 
                html_text += "<td>" + current_stocks[i].name + "</td>"; 
                html_text += "<td>" + (current_stocks[i].quantity/1000).toFixed(3)+ "</td>"; 
                html_text += "</tr>"; 
            }
        }
        html_text += "</tbody></table></td><td valign='top'>";

        html_text += "<table border='1'><thead><tr><th>Item Name</th><th>Quantity</th><th>Price</th></tr></thead><tbody>";
        for(i = 0; i < incoming_stocks.length; i++) {
            html_text += "<tr>"; 
            html_text += "<td>" + incoming_stocks[i].name + "</td>"; 
            html_text += "<td>" + (incoming_stocks[i].quantity/1000).toFixed(3)+ "</td>"; 
            html_text += "<td>" + incoming_stocks[i].price+ "</td>"; 
            html_text += "</tr>"; 
        }
        html_text += "</tbody></table></td><td valign='top'>";

        html_text += "<table border='1'><thead><tr><th>Item Name</th><th>Quantity</th><th>Price</th></tr></thead><tbody>";
        for(i = 0; i < outgoing_stocks.length; i++) {
            html_text += "<tr>"; 
            html_text += "<td>" + outgoing_stocks[i].name + "</td>"; 
            html_text += "<td>" + (outgoing_stocks[i].quantity/1000).toFixed(3)+ "</td>"; 
            html_text += "<td>" + outgoing_stocks[i].price+ "</td>"; 
            html_text += "</tr>"; 
        }
        html_text += "</tbody></table></td>";

        html_text += "</table></body></html>";
        INFO(html_text);
        mail.SendMail('kiranstalin@gmail.com', 'Daily Report for ' + moment().format('DD-MM-YYYY'), html_text, function(error) {
            INFO("Send Mail status %s", !error); 
        });
        return;
    });

    db.current_stocks(function(err, obj) {
        current_stocks = obj;
        eventEmitter.emit("done");
    });

    var obj = {};
    obj.to = moment().format('YYYY-MM-DD');
    obj.from = moment().format('YYYY-MM-DD');
    db.get_stock_details(obj, function (error, rows) {
        incoming_stocks = rows;
        eventEmitter.emit("done");
    });

    db.get_sales_details(obj, function (error, rows) {
        outgoing_stocks = rows;
        eventEmitter.emit("done");
    });
}

server = http.listen(port, function(){
    console.log("listening on http://%s:%d", hostname, port);
    sendDailyReport();
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
