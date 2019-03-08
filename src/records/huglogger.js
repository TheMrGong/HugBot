//@ts-check
const {Action} = require("./types")

const hugRecords = require("./hugrecords")
const tacklehugRecords = require("./tacklehugrecords")

const ready = Promise.all([hugRecords.databaseCreated, tacklehugRecords.databaseCreated])

/**
 * Logs a hug to the database
 * 
 * @param {number} guildId 
 * @param {number} hugger 
 * @param {number} hugged 
 * @throws possible error
 */
async function logHug(guildId, hugger, hugged) {
    try {
        return await hugRecords.insertRecord(guildId, hugger, hugged, Action.HUG)
    } catch (e) {
        throw e
    }
}

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
        return await tacklehugRecords.logTackleHug(guildId, tackler, tackled, tackleResult, timeLeft)
    } catch(e) {
        throw e
    }
}

module.exports = {
    ready,
    logHug
}