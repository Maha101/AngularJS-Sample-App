"use strict";

var util    = require('util'),
    moment  = require('moment'),
    debug   = require('debug'),
    db      = require('./db_sqlite');

var INFO  = debug('DB:INFO'),
    ERROR = debug('DB:ERR '),
    WARN  = debug('DB:WARN');

var format = util.format;

var create_items_table =
        "CREATE TABLE IF NOT EXISTS Items (\n" +
        "item_id INTEGER PRIMARY KEY autoincrement, \n" +
        "name VARCHAR(255) NOT NULL,\n" +
        "dt date NOT NULL DEFAULT (date('now', 'localtime')),\n" +
        "tm time NOT NULL DEFAULT (time('now', 'localtime')),\n" +
        "UNIQUE (name))\n";

var create_incoming_stocks_table =
        "CREATE TABLE IF NOT EXISTS incoming_stocks(\n" +
        "transaction_id INTEGER PRIMARY KEY autoincrement,\n" +
        "item_id INTEGER NOT NULL,\n" +
        "quantity INTEGER NOT NULL,\n" +
        "price INTEGER NOT NULL,\n" +
        "dt date  NOT NULL DEFAULT (date('now', 'localtime')),\n" +
        "tm time  NOT NULL DEFAULT (time('now', 'localtime')),\n" +
        "FOREIGN KEY (item_id) REFERENCES Items(item_id))\n";

var create_outgoing_stocks_table =
        "CREATE TABLE IF NOT EXISTS outgoing_stocks(\n" +
        "transaction_id INTEGER PRIMARY KEY autoincrement,\n" +
        "transaction_type VARCHAR,\n" +
        "item_id INTEGER NOT NULL,\n" +
        "quantity INTEGER NOT NULL,\n" +
        "price INTEGER NOT NULL,\n" +
        "reason VARCHAR,\n" +
        "dt date  NOT NULL DEFAULT (date('now', 'localtime')),\n" +
        "tm time  NOT NULL DEFAULT (time('now', 'localtime')),\n" +
        "FOREIGN KEY (item_id) REFERENCES Items(item_id))\n";

var create_outgoing_stocks_summary_view =
        "CREATE VIEW outgoing_stocks_summary AS\n" +
        "SELECT  item.item_id, item.name, SUM(quantity) AS quantity, SUM(price) AS price, outgoing.dt\n" +
        "FROM outgoing_stocks AS outgoing\n" +
        "JOIN items AS item ON outgoing.item_id == item.item_id\n" +
        "GROUP BY outgoing.item_id, outgoing.dt, item.name\n" +
        "ORDER BY outgoing.dt DESC, item.name\n";

var create_incoming_stocks_summary_view =
        "CREATE VIEW incoming_stocks_summary AS \n" +
        "SELECT  item.item_id, item.name, SUM(quantity) AS quantity, SUM(price) AS price, incoming.dt\n" +
        "FROM incoming_stocks AS incoming\n" +
        "JOIN items AS item ON incoming.item_id == item.item_id\n" +
        "GROUP BY incoming.item_id, incoming.dt, item.name\n" +
        "ORDER BY incoming.dt DESC, item.name\n";

var create_current_stocks_view =
        "CREATE VIEW current_stocks AS \n" +
        "SELECT incoming.item_id, incoming.name, (SUM(incoming.quantity) - SUM(outgoing.quantity)) AS quantity \n" +
        "FROM(SELECT item_id, name, SUM(quantity) AS quantity FROM incoming_stocks_summary GROUP BY item_id) AS incoming\n" +
        "JOIN (SELECT item_id, name, SUM(quantity) AS quantity FROM outgoing_stocks_summary GROUP BY item_id) AS outgoing\n" +
        "ON incoming.item_id == outgoing.item_id\n" +
        "GROUP BY incoming.item_id\n" +
        "UNION \n" +
        "SELECT item_id, name, SUM(quantity)\n" +
        "FROM incoming_stocks_summary\n" +
        "WHERE item_id NOT IN (SELECT item_id FROM outgoing_stocks_summary)\n" +
        "GROUP BY item_id\n";

// date_now returns todays date.
function date_now() {
    return moment().format('YYYY-MM-DD');
}

// time_now returns curent time.
function time_now() {
    return moment().format('HH-mm-ss');
}

// callback function takes one arguments about error status
// Will be set to false if some of the tables fail to be created.
function build_tables(callback) {
    var tables = [
        { "query": create_items_table,                  "name": "Item Table"},
        { "query": create_incoming_stocks_table,        "name": "Incoming Stocks Table"},
        { "query": create_outgoing_stocks_table,        "name": "Outgoing Stocks Tables"},
        { "query": create_incoming_stocks_summary_view, "name": "Incoming Stocks Summary View"},
        { "query": create_outgoing_stocks_summary_view, "name": "Outgoing Stocks Summary View"},
        { "query": create_current_stocks_view,          "name": "Current Stocks View"}
    ];

    INFO("Creating tables");
    db.create_tables(tables, function(failed, success) {
        if(failed) {
            ERROR("%d tables could not be created", failed);
            callback(true);
            return;
        }
        INFO("ALL tables where created");
        callback(false);
        return;
    });
}

// the item name should have only characters, numbers, _ & -
function validate_item_name(name) {
    if (name === "" || name.length < 5) {  
        return false;
    }
    var letter = /^[0-9a-zA-Z_\-]+$/;
    if (letter.test(name)) {
        return true;
    }
    return false;
}

// Function to insert a new item to items table.
function insert_item(name, callback) {
    if (!validate_item_name(name)) {
        var str = format("'%s' does not meet the requirements", name);
        process.nextTick(function () {
            callback(true, str);
            return;
        });
        return;
    } else {
        var stmt = format("INSERT INTO ITEMS(name, dt, tm) VALUES('%s','%s', '%s');", name.toLowerCase(), date_now(), time_now());
        db.execute_query(stmt, function (err, rows) {
            if (err) {
                ERROR("Insert operation for name '" + name + "' failed due to " + err);
                callback(true, err);
                return;
            }
            callback(false);
            return;
        });
    }
    return;
}

// Get Item id of an item
function get_item_id(name, callback) {
    var stmt = format("SELECT item_id FROM ITEMS WHERE name ='%s' COLLATE  NOCASE", name.toLowerCase());
    INFO("%s", stmt);
    db.execute_query(stmt, function (err, rows) {
        if (err) {
            ERROR("Query operation for item_id failed with error '%s'", err); 
            callback(true, err); 
            return;
        }
        if (rows.length == 1) {
            INFO("item id of %s is %d", name, rows[0].item_id);
            callback(false, rows[0].item_id);
        } else if (rows.length == 0) {
            ERROR("item '%s' does not exists", name);
            callback(true, format("Item '%s' does not exists", name));
        } else {
            ERROR("More than 1 id(%d) exists for name = '%s'", rows.length, name);
            // There should be only one row in the result. More than one
            // row is undefined behaviour
            callback(true, "Unknown response 101");
        }
        return;
    });
}

// Gets the list of item names
function get_item_list(callback) {
    var stmt = format("SELECT item_id, name, dt, tm FROM ITEMS ORDER BY LOWER(name)");
    db.execute_query(stmt, function(err, rows) {
        if(err) {
            ERROR("Item list fetch failed with error '%s'", err);
            callback(true, err);
            return;
        }
        callback(false, rows);
        return;
    });
    return;
}

function get_current_stocks(callback) {
    var stmt = format("SELECT item_id, name, quantity FROM current_stocks ORDER BY LOWER(name)");
    db.execute_query(stmt, function(err, rows) {
        if(err) {
            ERROR("current stocks fetch failed with error '%s'", err);
            callback(true, err);
            return;
        }
        callback(false, rows);
        return;
    });
    return;
}

// Usage 
// obj is json with the following variables.
//      name     => name of the item to which stocks should be added
//      quantity => quantity of the stocks in gms
//      price    => price paid for the Stocks
//      date     => date of the incoming stocks. [Default value is today's date]
//      time     => time of the incoming stocks. [Default value is current time]
// callback takes one arguments which tells wheather there is an error or not

function add_incoming_stock(obj, callback) {

    //Check if the obj has the required information to run the query.
    //check the type of the parameters passed.
    if(typeof obj.name     !== 'string'  || 
       typeof obj.quantity !== 'number'  || 
       typeof obj.price    !== 'number') 
    {
        ERROR("required input doesnt exists in correct format to add stocks to db");
        process.nextTick(function() {
            callback(true, "malformed request");
            return;
        });
        return;
    }

    // Sanity check that the quantity and price are not less than 0
    if(obj.quantity <= 0 ||
       obj.price <= 0)
    {
        ERROR("price or quantity is less than 0");
        process.nextTick(function() {
            callback(true, "price or quantity is less than 0");
            return;
        });
        return;
    }

    // Set date and time if not set.
    if(typeof obj.date === 'undefined') {
        obj.date = date_now();
    }

    if(typeof obj.time === 'undefined') {
        obj.time = time_now();
    }

    // Check the format of date and time.
    if(!moment(obj.date, "YYYY-MM-DD").isValid() || 
       !moment(obj.time, "HH-mm-ss").isValid()) 
    {
        ERROR("date and time not in required format");
        process.nextTick(function() {
            callback(true, "malformed request");
            return;
        });
        return;
    }

    // Get the item_id of the name to run the query.
    get_item_id(obj.name, function(err, item_id) {
        if(err) {
            ERROR("item name '%s' does not exists in DB", obj.name);
            callback(true, err);
            return;
        }
        var stmt = format("INSERT INTO incoming_stocks (item_id, quantity, price, dt, tm) values(%d, %d, %d, '%s', '%s');",
                          item_id,
                          obj.quantity,
                          obj.price,
                          obj.date,
                          obj.time);
        db.execute_query(stmt, function(err, rows) {
            if(err) {
                ERROR("Inserting stocks for %s failed due to '%s'", obj.name, err);
                callback(true, err);
                return;
            }
            var msg = format("Added %d gms of '%s' to db", obj.quantity, obj.name);
            callback(false, msg);
            return;
        });
        return;
    });
}

// Format of obj
//      from => Date from which details should be given.
//      to   => Date to which details should be given. 
//      Summary[default:true] => [true, false]. to give summary or individual transactions.[default true]
//      name => name of the item for which the details should be given. If no
//              name is provided the details are given for all the items.
//

function get_stock_details(obj, callback) {

    var error_msg;

    // Check the format of date and time.
    if(typeof obj.from !== 'string' || typeof obj.to   !== 'string') {
        error_msg = format("obj.to and obj.from are in required format");
    } else if(!moment(obj.to, "YYYY-MM-DD").isValid() || !moment(obj.from, "YYYY-MM-DD").isValid()) {
        error_msg = format("to and from not in required format");
    }

    if(typeof obj.name === 'undefined') {
        obj.name = '%';
    } else if(typeof obj.name !== 'string') {
        error_msg = format("item_name '%s' is not string", name);
    }

    if(typeof obj.summary === 'undefined') {
        obj.summary = 'true';
    } else if(!(obj.summary == 'true' || obj.summary == 'false')) {
        error_msg = format("summary should be either 'true' or 'false'");
    }

    // If the erorr_msg is set then print the error msg and return.
    if(typeof error_msg === 'string') {
        ERROR(error_msg);
        process.nextTick(function() { callback(true, error_msg); return; });
        return;
    }

    var stmt;
    if(obj.summary == 'false') {
        stmt = format("SELECT stocks.transaction_id, stocks.item_id, items.name, stocks.quantity, stocks.price, stocks.dt\n" +
                      "FROM incoming_stocks AS stocks\n" +
                      "JOIN items AS items\n" +
                      "ON items.item_id == stocks.item_id\n" +
                      "WHERE (stocks.dt >= '%s' AND stocks.dt <= '%s') AND (items.name LIKE '%s')\n" +
                      "ORDER BY stocks.dt DESC",
                      obj.from,
                      obj.to,
                      obj.name);
        INFO(stmt);
    } else {
        stmt = format("SELECT items.name, COUNT(items.name) as count, SUM(stocks.quantity) as quantity, SUM(stocks.price) as price\n" +
                      "FROM incoming_stocks AS stocks\n" +
                      "JOIN items AS items\n" +
                      "ON items.item_id == stocks.item_id\n" +
                      "WHERE (stocks.dt >= '%s' AND stocks.dt <= '%s') AND (items.name LIKE '%s')\n" +
                      "group by items.name",
                      obj.from,
                      obj.to,
                      obj.name);
        INFO(stmt);
    }

    db.execute_query(stmt, function(err, rows) {
        if(err) {
            ERROR("Getting stock details failed for obj '%s'", JSON.stringify(obj));
            callback(true, err);
            return;
        }
        callback(false, rows);
        return;
    });
    return;
}

// Format of obj
//      from => Date from which details should be given.
//      to   => Date to which details should be given. 
//      Summary[default:true] => [true, false]. to give summary or individual transactions.[default true]
//      name => name of the item for which the details should be given. If no
//              name is provided the details are given for all the items.
//

function get_sales_details(obj, callback) {
    var error_msg;
    INFO("object %s", JSON.stringify(obj));
    // Check the format of date and time.
    if (typeof obj.from !== 'string' || typeof obj.to !== 'string') {
        error_msg = format("obj.to and obj.from are in required format");
    } else if (!moment(obj.to, "YYYY-MM-DD").isValid() || !moment(obj.from, "YYYY-MM-DD").isValid()) {
        error_msg = format("to and from not in required format");
    }
    
    if (typeof obj.name === 'undefined') {
        obj.name = '%';
    } else if (typeof obj.name !== 'string') {
        error_msg = format("item_name '%s' is not string", name);
    }
    
    if (typeof obj.summary === 'undefined') {
        obj.summary = 'true';
    } else if (!(obj.summary == 'true' || obj.summary == 'false')) {
        error_msg = format("summary should be either 'true' or 'false'");
    }
    
    // If the erorr_msg is set then print the error msg and return.
    if (typeof error_msg === 'string') {
        ERROR(error_msg);
        process.nextTick(function () { callback(true, error_msg); return; });
        return;
    }
    var stmt;
    if (obj.summary == 'false') {
         stmt = format("SELECT stocks.transaction_id, stocks.item_id, items.name, stocks.quantity, stocks.price, stocks.dt, stocks.transaction_type, stocks.reason\n" +
                      "FROM outgoing_stocks AS stocks\n" +
                      "JOIN items AS items\n" +
                      "ON items.item_id == stocks.item_id\n" +
                      "WHERE (stocks.dt >= '%s' AND stocks.dt <= '%s') AND (items.name LIKE '%s')\n" +
                      "ORDER BY stocks.dt DESC",
                      obj.from,
                      obj.to,
                      obj.name);
    } else {
        stmt = format("SELECT items.name, COUNT(items.name) as count, SUM(stocks.quantity) as quantity, SUM(stocks.price) as price\n" +
                      "FROM outgoing_stocks AS stocks\n" +
                      "JOIN items AS items\n" +
                      "ON items.item_id == stocks.item_id\n" +
                      "WHERE (stocks.dt >= '%s' AND stocks.dt <= '%s') AND (items.name LIKE '%s')\n" +
                      "group by items.name",
                      obj.from,
                      obj.to,
                      obj.name);
    }
    INFO(stmt);

    db.execute_query(stmt, function (err, rows) {
        if (err) {
            ERROR("Getting sales details failed for obj '%s'", JSON.stringify(obj));
            callback(true, err);
            return;
        }
        callback(false, rows);
        return;
    });

}


// Usage 
// obj is json with the following variables.
//      name     => name of the item to which stocks should be added
//      quantity => quantity of the stocks in gms
//      price    => price paid for the Stocks
//      date     => date of the incoming stocks. [Default value is today's date]
//      time     => time of the incoming stocks. [Default value is current time]
// callback takes one arguments which tells wheather there is an error or not

function sell_stock(obj, callback) {
    
    //Check if the obj has the required information to run the query.
    //check the type of the parameters passed.
    if (typeof obj.name !== 'string' || 
       typeof obj.quantity !== 'number' || 
       typeof obj.price !== 'number') {
        ERROR("required input doesnt exists in correct format to add stocks to db");
        process.nextTick(function () {
            callback(true, "malformed request");
            return;
        });
        return;
    }
    
    // Sanity check that the quantity and price are not less than 0
    if (obj.quantity <= 0 ||
       obj.price <= 0) {
        ERROR("price or quantity is less than 0");
        process.nextTick(function () {
            callback(true, "price or quantity is less than 0");
            return;
        });
        return;
    }
    
    // Set date and time if not set.
    if (typeof obj.date === 'undefined') {
        obj.date = date_now();
    }
    
    if (typeof obj.time === 'undefined') {
        obj.time = time_now();
    }
    
    // Check the format of date and time.
    if (!moment(obj.date, "YYYY-MM-DD").isValid() || 
       !moment(obj.time, "HH-mm-ss").isValid()) {
        ERROR("date and time not in required format");
        process.nextTick(function () {
            callback(true, "malformed request");
            return;
        });
        return;
    }
    
    // Get the item_id of the name to run the query.
    get_item_id(obj.name, function (err, item_id) {
        if (err) {
            ERROR("item name '%s' does not exists in DB", obj.name);
            callback(true, err);
            return;
        }
        var stmt = format("INSERT INTO outgoing_stocks (item_id, quantity, price, dt, tm, transaction_type, reason) values(%d, %d, %d, '%s', '%s', '%s', '%s');",
                          item_id,
                          obj.quantity,
                          obj.price,
                          obj.date,
                          obj.time,
                          obj.transaction_type,
                          obj.reason);
        INFO("%s", stmt);
        db.execute_query(stmt, function (err, rows) {
            if (err) {
                ERROR("Selling  %s failed due to '%s'", obj.name, err);
                callback(true, err);
                return;
            }
            var msg = format("Added %d gms of '%s' to db", obj.quantity, obj.name);
            callback(false, msg);
            return;
        });
        return;
    });
}

module.exports = {
    open: db.open,
    status: db.status,
    close: db.close,
    build_db: build_tables,

    new_item: insert_item,
    item_id: get_item_id,
    item_list: get_item_list,

    current_stocks: get_current_stocks,

    add_stock: add_incoming_stock,
    get_stock_details: get_stock_details,
    
    sell_stock: sell_stock,
    get_sales_details: get_sales_details
};
