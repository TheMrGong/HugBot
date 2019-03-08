//@ts-check
const mysql = require("mysql")
const config = require("../config/config.js");

const db = mysql.createPool({
    connectionLimit: 10,
    host: config.mysql.host,
    user: config.mysql.username,
    password: config.mysql.password,
    database: config.mysql.database,
    port: config.mysql.port,
    acquireTimeout: 1000 * 30
});

const query = require("./sqlwrapper.js")(db)

module.exports = {
    db,
    query
}