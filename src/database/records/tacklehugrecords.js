//@ts-check


const TABLE_NAME = "tacklehug_records"

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id INT AUTO_INCREMENT NOT NULL,
    record INT NOT NULL,
    tackleResult INT NOT NULL,
    timeLeft BIGINT NOT NULL,
    PRIMARY KEY (id)
);`
/**
 * @typedef {number} Tackles
 */

/**
 * @enum {Tackles}
 */
const TackleResult = {
    DODGED: 1,
    ACCEPTED: 2,
    TOO_LONG: 3
}

const INSERT_TACKLE_DATA = `INSERT INTO ${TABLE_NAME} (record, tackleResult, timeLeft) VALUES(?, ?, ?)`

const { query, setupDatabase } = require("../util/sql")

const databaseCreated = setupDatabase(CREATE_TABLE)

/**
 * @param {number} recordId - id to record in hug_records
 * @param {TackleResult} tackleResult 
 * @param {number} timeLeft - time taken for the result to happen
 * @returns {Promise<any>} The result of the insert
 */
async function insertTackleHugInfo(recordId, tackleResult, timeLeft) {
    try {
        return await query(INSERT_TACKLE_DATA, [recordId, tackleResult, timeLeft])
    } catch (e) {
        throw e
    }
}

module.exports = {
    databaseCreated,
    insertTackleHugInfo,
    TackleResult
}