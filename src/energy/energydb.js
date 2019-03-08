//@ts-check
const TABLE_NAME = "hug_energy"
const { query } = require("../util/sql.js")

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    userId BIGINT NOT NULL,
    energy DECIMAL(16,14) NOT NULL,
    PRIMARY KEY(guildId, userId)
);`

/**
 * @param {boolean} increasing Whether to increase by this amount
 */
const MODIFY_ENERGY = increasing => `INSERT INTO ${TABLE_NAME} (guildId, userId, energy) VALUES(?, ?, 0) ON DUPLICATE KEY UPDATE energy = energy ${increasing ? "+" : "-"} ?`

const GET_ENERGY = `SELECT energy FROM ${TABLE_NAME} WHERE guildId = ? AND userId = ?`

const ready = query(CREATE_TABLE, [])

/**
 * @param {number} guildId 
 * @param {number} userId 
 * @returns {Promise<number>} returns the amount of energy they have or 0 if not in the database
 */
async function getEnergy(guildId, userId) {
    const result = await query(GET_ENERGY, [guildId, userId])
    // TODO get the energy or return 0

    return 0
}

/**
 * 
 * @param {number} guildId 
 * @param {number} userId 
 * @param {number} amount Amount to modify energy by
 * @param {boolean} increasing Whether to increase or decrease
 * @returns {Promise<any>} mysql result
 */
async function modifyEnergy(guildId, userId, amount, increasing) {
    return await query(MODIFY_ENERGY(increasing), [guildId, userId, amount])
}

module.exports = {
    ready,
    getEnergy,
    modifyEnergy
}