"use strict";

var fs      = require("fs"),
    sqlite3 = require("sqlite3"),
    util    = require('util'),
    moment  = require('moment'),
    debug   = require('debug');

var INFO  = debug('SQL:INFO');
var ERROR = debug('SQL:ERR ');
var WARN  = debug('SQL:WARN');

// Global variables
var db, repository;

// Returns the current status of the DB
function db_status() {
    if(typeof db === 'undefined') {
        return false;
    }
    return true;
}

// Close the DB
function db_close() {
    if(db_status()) {
        db.close();
    } else {
        ERROR("Closing a unopened db");
    }
}

// open the db is there is no opened db already.
function db_open(db_file, create_new) {
    // Check if the db_file argument is string
    if(typeof db_file !== "string") {
        ERROR("usage db_open(db_file_path, create_new_flag)");
        return false;
    }

    // Confirm That we are not the openning the databse twice.
    if (typeof db === "undefined") {
        repository = db_file || null;
        if (fs.existsSync(repository)) {
            db = new sqlite3.Database(repository);
            return true;
        } else if (create_new) {
            // If the create_new is set then we will try to create
            // the database file as it does not exists.
            db = new sqlite3.Database(repository, sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE);
            return true;
        } else {
            ERROR("db file '%s' does not exists", db_file);
        }
        return false;
    }

    ERROR("Trying to open DB file twice");
    return false;
}

// Create all the requested tables.
// The format of table_query_array is 
// [ 
//   { query, query_name}, 
//   { query, query_name}, 
//   ...
// ]
// callback(error, success) function takes 2 arguments
// number of query that failed and succeeded.
function db_create_tables(table_query_array, callback) {

    if (!db_status()) {
        ERROR("trying to create table without opening database");
        process.nextTick(function() {
            //callback with 0 success.
            callback(table_query_array.length, 0); 
        });
        return;
    }

    db.serialize(function() {
        var success = 0, failure = 0;
        function run_query(query, name) {
            db.run(query, function(err) {
                if(err !== null) {
                    ERROR("failed to create %s due to '%s'", name, err);
                    failure++;
                } else {
                    INFO("Created %s", name);
                    success++;
                }
                if((failure+success) == table_query_array.length) {
                    callback(failure, success);
                }
                return;
            });
        }

        for(var i = 0; i < table_query_array.length; i++) {
            run_query(table_query_array[i].query, table_query_array[i].name);
        }
    });
    return;
}

// Executes a query and then callback is called with 
// the results.
function db_execute(query, callback) {
    if (!db_status()) {
        ERROR("trying to run query without opening database");
        callback(true, "db not initialized yet");
        return;
    }
    db.all(query, callback);
    return;
}

module.exports = {
    open: db_open,
    status: db_status,
    close: db_close,
    create_tables: db_create_tables,
    execute_query: db_execute,
};
