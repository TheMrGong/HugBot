//@ts-check
const TABLE_NAME = "preferences"
const { query } = require("../util/sql/sql")

const { Preference } = require("./prefenceapi")
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    userId BIGINT NOT NULL,
    prefName CHAR(100),
    prefValue CHAR(100) NOT NULL,
    PRIMARY KEY(guildId, userId, prefName)
);`

const ready = query(CREATE_TABLE, [])

const GET_PREFERENCES = `SELECT prefName, prefValue FROM ${TABLE_NAME} WHERE guildId = ? AND userID = ?`
const UPDATE_OR_INSERT = `INSERT INTO ${TABLE_NAME} (guildId, userId, prefName, prefValue) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE prefValue = VALUES(prefValue)`

async function getPreferences(serverId, userId) {
    const results = await query(GET_PREFERENCES, [serverId, userId])

    /**@type {Preference[]} */
    const preferences = []

    for (let k in results) {
        const result = results[k]
        const pref = new Preference(result.prefName, result.prefValue)
        pref.serverId = serverId
        pref.userId = userId
        preferences.push(pref)
    }
    return preferences
}

/**
 * @param {Preference} preference 
 * @returns {Promise<any>}
 */
async function updatePreference(preference) {
    return query(UPDATE_OR_INSERT, [preference.serverId, preference.userId, preference.name, preference._stringValue])
}

module.exports = {
    ready,
    getPreferences,
    updatePreference
}