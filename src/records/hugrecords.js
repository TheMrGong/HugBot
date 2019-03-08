//@ts-check
const mysql = require("mysql")
const config = require("../config/config.js");

const TABLE_NAME = "hug_records"

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id INT AUTO_INCREMENT NOT NULL,
    guildId BIGINT NOT NULL,
    senderId BIGINT NOT NULL,
    affectedId BIGINT NOT NULL,
    timestamp BIGINT NOT NULL,
    action CHAR(60) NOT NULL,
    PRIMARY KEY (id)
  );`

const INSERT_RECORD = `INSERT INTO ${TABLE_NAME} (
  guildId,
  senderId,
  affectedId,
  timestamp,
  action
)
VALUES(?, ?, ?, ?, ?)`
const { db, query } = require("../util/sql.js")

const databaseCreated = new Promise(resolve => db.query(CREATE_TABLE, [], (err) => {
    if (err) {
        console.log(err)
        resolve(false)
    } else resolve(true)
}));

/**
 * 
 * @param {number} guildId 
 * @param {number} senderId 
 * @param {number} affectedId 
 * @param {import("./types").Action} action
 */
async function insertRecord(guildId, senderId, affectedId, action) {
    try {
        return await query(INSERT_RECORD, [guildId, senderId, affectedId, new Date().getTime(), action.id])
    } catch (e) {
        throw e
    }
}

module.exports = {
    databaseCreated,
    insertRecord
}