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
    acquireTimeout: 1000 * 30,
    bigNumberStrings: true,
    supportBigNumbers: true
});

const query = require("./sqlwrapper.js")(db)

/**
 * 
 * @param {string} specification - SQL statement
 */
async function setupDatabase(specification) {
    return new Promise(resolve => db.query(specification, [], (err) => {
        if (err) {
            console.log(err)
            resolve(false)
        } else resolve(true)
    }));
}

module.exports = {
    db,
    query,
    setupDatabase
}