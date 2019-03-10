//@ts-check
const TABLE_NAME = "hug_energy"
const { query } = require("../util/sql.js")
const energyapi = require("./energyapi")

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
const MODIFY_ENERGY = increasing => `INSERT INTO ${TABLE_NAME} (guildId, userId, energy, lastDecrement) VALUES(?, ?, 1, ?) ON DUPLICATE KEY UPDATE energy = energy ${increasing ? "+" : "-"} ?${!increasing ? ", lastDecrement=VALUES(lastDecrement)" : ""}`

const GET_ENERGY = `SELECT energy, lastDecrement FROM ${TABLE_NAME} WHERE guildId = ? AND userId = ?`

const GET_TO_DECREMENT = () => `SELECT guildId, userId, energy FROM ${TABLE_NAME} WHERE ${new Date().getTime()} - lastDecrement >= ? AND energy > 0;`
const DECREMENT_FOR_GUILD = `UPDATE ${TABLE_NAME} SET energy = energy - 1, lastDecrement = ? WHERE guildId = ? AND userId IN (?)`

const ready = query(CREATE_TABLE, [])

/**
 * Gets the energy for a user and the last time their energy was decreased
 * 
 * @param {string} guildId 
 * @param {string} userId 
 * @returns {Promise<energyapi.Energy>} returns the amount of energy they have or 0 if not in the database
 */
async function getEnergy(guildId, userId) {
    const result = await query(GET_ENERGY, [guildId, userId])

    if (result.length == 0) return {
        energy: 0,
        lastRemoved: 0
    } // No energy found
    const data = result[0]
    return {
        energy: data.energy,
        lastRemoved: data.lastDecrement
    }
}

/**
 * Modifies energy for user, updating lastDecrement if
 * increasing is false
 * 
 * @param {string} guildId 
 * @param {string} userId 
 * @param {number} amount Amount to modify energy by
 * @param {boolean} increasing Whether to increase or decrease
 * @returns {Promise<any>} mysql result
 */
async function modifyEnergy(guildId, userId, amount, increasing) {
    return await query(MODIFY_ENERGY(increasing), [guildId, userId, new Date().getTime(), amount])
}

/**
 * @param {number} decrementAfter - Time after last decrement to check
 */
async function getToDecrement(decrementAfter) {
    const results = await query(GET_TO_DECREMENT(), [decrementAfter])
    const ret = {}
    results.forEach(packet => {
        /**@type {Array<Object>} */
        let guildData = ret[packet.guildId]
        if (!guildData) {
            guildData = []
            ret[packet.guildId] = guildData
        }
        if (guildData.filter(it => it.userId == packet.userId).length == 0)
            guildData.push({
                userId: packet.userId,
                energy: packet.energy
            })
    })
    return ret
}

async function decrementAll(data) {
    for (let guildId in data) {
        /**@type {Array<number>} */
        const userIds = data[guildId].map(it => it.userId)
        await query(DECREMENT_FOR_GUILD, [new Date().getTime(), guildId, userIds])
    }
}

module.exports = {
    ready,
    getEnergy,
    modifyEnergy,
    getToDecrement,
    decrementAll
}