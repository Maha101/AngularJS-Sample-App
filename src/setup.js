"use strict";

var fs      = require("fs"),
    util    = require('util'),
    moment  = require('moment'),
    debug   = require('debug'),
    events  = require('events'),
    db      = require('./db');

var INFO  = debug('APP:INFO');
var ERROR = debug('APP:ERR');
var WARN  = debug('APP:WARN');
var ASSERT = debug('APP:ASSERT');

var num_checks = 0;
function assert(cond, msg) {
    num_checks++;
    if (cond) {
        ASSERT("====================================");
        ASSERT(msg);
        ASSERT("====================================");
        console.assert(!(cond), msg);
    }
}

function print_stats() {
    INFO("====================================");
    INFO("Number of tests : %d", num_checks);
    INFO("====================================");
}

var test_db_path = '../db/goldennuts.db';

function create_database_build_tables() {

    INFO("open databse");
    assert(db.status(), "db_status is open before call to db.open()");
    assert(db.open(test_db_path, true) == false, "unable to open database file");
    assert(!db.status(), "db_status is closed as a call to db.open()");

    INFO("build sql tables");
    db.build_db(function(err) {
        assert(err, "Failed to create some tables");
        return;
    });
}

create_database_build_tables();
