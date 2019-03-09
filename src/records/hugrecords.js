//@ts-check

/**
 * @typedef {Object} HugAction
 * @property {string} id - Action name in the database
 * @property {number} energy - Amount of energy required to perform the action
 * @property {boolean} [extraData] - Requires extra data in a seperate database
 */

const { query, setupDatabase } = require("../util/sql.js")
const tacklehugRecords = require("./tacklehugrecords")

/**
 * @enum {HugAction}
 */
const Action = {
    HUG: {
        id: "hug",
        energy: 3
    },
    TACKLE_HUG: {
        id: "tacklehug",
        energy: 10,
        extraData: true
    },
    PAT: {
        id: "pat",
        energy: 1
    },
    GLOMP: {
        id: "glomp",
        energy: 5
    }
}

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

/**
 * @param {boolean} sent Whether to count for amount sent or received
 */
const COUNT_RECORD = (sent) => `SELECT COUNT(*) AS total FROM ${TABLE_NAME} WHERE guildId = ? AND ${sent ? "senderId" : "affectedId"} = ? AND action=?;`

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
 * @param {string} guildId 
 * @param {string} senderId 
 * @param {string} affectedId 
 * @param {HugAction} action
 * @returns {Promise<any>} The result of the insert
 */
async function logAction(guildId, senderId, affectedId, action) {
    try {
        if (action.extraData) throw "Cannot log this action directly, requires extra data."
        return await insertRecord(parseInt(guildId), parseInt(senderId), parseInt(affectedId), action)
    } catch (e) {
        throw e
    }
}

/**
 * @param {string} guildId 
 * @param {string} checkingId
 * @param {boolean} sent - Whether we're checking the amount we sent or received
 * @param {HugAction} action 
 * @returns {Promise<number>} Number of actions sent/received
 */
async function getTotalActions(guildId, checkingId, sent, action) {
    try {
        const result = await query(COUNT_RECORD(sent), [parseInt(guildId), parseInt(checkingId), action.id])
        if (result.length == 0) return 0
        return result[0].total
    } catch (e) {
        throw e
    }
}

/**
 * @param {string} guildId - guild id this occurred in
 * @param {string} tackler - discord id of tackler
 * @param {string} tackled - discord id of tackled
 * @param {tacklehugRecords.Tackles} tackleResult 
 * @param {number} timeLeft - time taken for someone to click Accept or Dodge. -1 if they took too long
 * @returns {Promise<any>} The result of the insert
 */
async function logTackleHug(guildId, tackler, tackled, tackleResult, timeLeft) {
    try {
        const result = await insertRecord(parseInt(guildId), parseInt(tackler), parseInt(tackled), Action.TACKLE_HUG)
        return await tacklehugRecords.insertTackleHugInfo(result.insertId, tackleResult, timeLeft)
    } catch (e) {
        throw e
    }
}

module.exports = {
    ready,
    logAction,
    logTackleHug,
    getTotalActions,
    Action
}