//@ts-check
const mysql = require("mysql")
const config = require("../config/config.js");
const hugrecords = require("./hugrecords"),
    Action = hugrecords.Action

const TABLE_NAME = "tacklehug_records"

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id INT AUTO_INCREMENT NOT NULL,
    record INT NOT NULL,
    tackleResult INT NOT NULL,
    timeLeft BIGINT NOT NULL,
    PRIMARY KEY (id)
);`

const INSERT_TACKLE_DATA = `INSERT INTO ${TABLE_NAME} (record, tackleResult, timeLeft) VALUES(?, ?, ?)`

const { db, query } = require("../util/sql")

const databaseCreated = new Promise(resolve => db.query(CREATE_TABLE, [], (err) => {
    if (err) {
        console.log(err)
        resolve(false)
    } else resolve(true)
}));

/**
 * 
 * @param {number} guildId - guild id this occurred in
 * @param {number} tackler - discord id of tackler
 * @param {number} tackled - discord id of tackled
 * @param {import("./types").TackleResult} tackleResult 
 * @param {number} timeLeft - time taken for the result to happen
 */
async function logTackleHug(guildId, tackler, tackled, tackleResult, timeLeft) {
    try {
        const result = await hugrecords.insertRecord(guildId, tackler, tackled, Action.TACKLE_HUG)
        console.log("got initial result ")
        console.log(result)
        return await query(INSERT_TACKLE_DATA, [result.insertId, tackleResult, timeLeft])

    } catch (e) {
        throw e
    }
}

module.exports = {
    databaseCreated,
    logTackleHug
}