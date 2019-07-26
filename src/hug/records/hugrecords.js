//@ts-check

const { query, setupDatabase } = require("../../util/sql/sql")
const tacklehugRecords = require("./tacklehugrecords")
const hugAction = require("../action/hugaction")

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
const COUNT_RECORD = (sent) => `SELECT COUNT(*) AS total FROM ${TABLE_NAME} WHERE guildId = ? AND ${sent ? "senderId" : "affectedId"} = ? AND action IN (?);`

const ready = Promise.all([setupDatabase(CREATE_TABLE), tacklehugRecords.databaseCreated])

/**
 * @param {string} guildId 
 * @param {string} senderId 
 * @param {string} affectedId 
 * @param {hugAction.HugActionData} action
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
 * @param {hugAction.HugActionData} action
 * @returns {Promise<any>} The result of the insert
 */
async function logAction(guildId, senderId, affectedId, action) {
    try {
        return await insertRecord(guildId, senderId, affectedId, action)
    } catch (e) {
        throw e
    }
}

/**
 * @param {string} guildId 
 * @param {string} checkingId
 * @param {boolean} sent - Whether we're checking the amount we sent or received
 * @param {hugAction.HugActionData} action 
 * @param {boolean} [group] - Whether to count the entire group
 * @returns {Promise<number>} Number of actions sent/received
 */
async function getTotalActions(guildId, checkingId, sent, action, group = false) {
    try {
        /**@type {string|Array<string>} */
        let actionIds = action.id
        if (group && action.group) {
            actionIds = []
            for (let k in hugAction.HugActions) {
                /**@type {hugAction.HugActionData} */
                const action = hugAction.HugActions[k]
                if (action.group == action.group)
                    actionIds.push(action.id)
            }
        }
        const result = await query(COUNT_RECORD(sent), [guildId, checkingId, actionIds])
        if (result.length == 0) return 0
        return result[0].total
    } catch (e) {
        throw e
    }
}

module.exports = {
    ready,
    logAction,
    getTotalActions
}