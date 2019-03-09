//@ts-check

/**
 * @typedef {import("./types").HugAction} HugAction
 * @typedef {number} TackleResult
 */

const { db, query, setupDatabase } = require("../util/sql.js")
const tacklehugRecords = require("./tacklehugrecords")
const types = require("./types")
const Action = types.Action

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

const ready = Promise.all([setupDatabase(CREATE_TABLE), tacklehugRecords.databaseCreated])

/**
 * @param {number} guildId 
 * @param {number} senderId 
 * @param {number} affectedId 
 * @param {HugAction} action
 * @returns {Promise<any>} The result of the insert
 */
async function insertRecord(guildId, senderId, affectedId, action) {
    try {
        return await query(INSERT_RECORD, [guildId, senderId, affectedId, new Date().getTime(), action.id])
    } catch (e) {
        throw e
    }
}

/**
 * @param {number} guildId 
 * @param {number} senderId 
 * @param {number} affectedId 
 * @param {HugAction} action
 * @returns {Promise<any>} The result of the insert
 */
async function logAction(guildId, senderId, affectedId, action) {
    try {
        if (action.extraData) throw "Cannot log this action directly, requires extra data."
        return await insertRecord(guildId, senderId, affectedId, action)
    } catch (e) {
        throw e
    }
}

/**
 * @param {number} guildId - guild id this occurred in
 * @param {number} tackler - discord id of tackler
 * @param {number} tackled - discord id of tackled
 * @param {TackleResult} tackleResult 
 * @param {number} timeLeft - time taken for someone to click Accept or Dodge. -1 if they took too long
 * @returns {Promise<any>} The result of the insert
 */
async function logTackleHug(guildId, tackler, tackled, tackleResult, timeLeft) {
    try {
        const result = await insertRecord(guildId, tackler, tackled, Action.TACKLE_HUG)
        return await tacklehugRecords.insertTackleHugInfo(result.insertId, tackleResult, timeLeft)
    } catch (e) {
        throw e
    }
}

module.exports = {
    ready,
    logAction,
    logTackleHug
}