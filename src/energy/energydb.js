//@ts-check
const TABLE_NAME = "hug_energy"
const { query } = require("../util/sql.js")
const Energy = require("./types")

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    userId BIGINT NOT NULL,
    energy DECIMAL(16,14) NOT NULL,
    lastDecrement BIGINT NOT NULL,
    PRIMARY KEY(guildId, userId)
);`

/**
 * Automatically updates lastDecrement when increasing is false
 * 
 * @param {boolean} increasing Whether to increase by this amount
 */
const MODIFY_ENERGY = increasing => `INSERT INTO ${TABLE_NAME} (guildId, userId, energy, lastDecrement) VALUES(?, ?, 0, ?) ON DUPLICATE KEY UPDATE energy = energy ${increasing ? "+" : "-"} ?${!increasing ? ", lastDecrement=VALUES(lastDecrement)" : ""}`

const GET_ENERGY = `SELECT energy, lastDecrement FROM ${TABLE_NAME} WHERE guildId = ? AND userId = ?`

const ready = query(CREATE_TABLE, [])

/**
 * Gets the energy for a user and the last time their energy was decreased
 * 
 * @param {number} guildId 
 * @param {number} userId 
 * @returns {Promise<Energy>} returns the amount of energy they have or 0 if not in the database
 */
async function getEnergy(guildId, userId) {
    const result = await query(GET_ENERGY, [guildId, userId])

    if (result.length == 0) return new Energy(0, 0) // No energy found
    const data = result[0]
    return new Energy(data.energy, data.lastDecrement)
}

/**
 * Modifies energy for user, updating lastDecrement if
 * increasing is false
 * 
 * @param {number} guildId 
 * @param {number} userId 
 * @param {number} amount Amount to modify energy by
 * @param {boolean} increasing Whether to increase or decrease
 * @returns {Promise<any>} mysql result
 */
async function modifyEnergy(guildId, userId, amount, increasing) {
    return await query(MODIFY_ENERGY(increasing), [guildId, userId, new Date().getTime(), amount])
}

module.exports = {
    ready,
    getEnergy,
    modifyEnergy
}