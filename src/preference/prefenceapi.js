//@ts-check

const db = require("./preferencedb")

/**
 * server id to server info
 * @type {Object.<string, ServerInfo>}
 */
const data = {}

/**
 * user id to preferences
 * @typedef {Object.<string, Preference[]>} ServerInfo
 */

/**@type {Array<function(): Preference>} */
const DEFAULT_PREFERENCES = []

async function getPreferences(serverId, userId) {
    /**@type {ServerInfo} */
    let serverInfo = data[serverId]

    if (!serverInfo) {
        serverInfo = {}
        data[serverId] = serverInfo
    }
    let userPreferences = serverInfo[userId]
    if (userPreferences === undefined) {
        userPreferences = generateDefaultPreferences()

        let findExistingPreference = (name) => userPreferences.filter(it => it.name == name)[0]

        const dbPreferences = await db.getPreferences(serverId, userId)
        for (let pref of dbPreferences) {
            const existing = findExistingPreference[pref.name]
            if (!existing) {
                userPreferences.push(pref)
                console.warn("WARN! Found a preference in the database but not as a default! [" + pref.name + "]")
            } else existing._stringValue = pref._stringValue
        }
        serverInfo[userId] = userPreferences
    }
    return userPreferences
}

/**
 * @returns {Preference[]}
 */
function generateDefaultPreferences(serverId, userId) {
    const preferences = []
    for (let generator of DEFAULT_PREFERENCES) {
        const pref = generator()
        pref.serverId = serverId
        pref.userId = userId

        preferences.push(pref)
    }
    return preferences
}

/**
 * @param {string} name
 * @param {string} defaultValue
 */
function registerPreference(name, defaultValue) {
    DEFAULT_PREFERENCES.push(() => new Preference(name, defaultValue))
}

class Preference {
    constructor(name, stringValue) {
        this.name = name
        this.serverId = ""
        this.userId = ""
        this._stringValue = stringValue
    }

    get stringValue() {
        return this._stringValue
    }

    async update(newValue) {
        await db.updatePreference(this)
        this._stringValue = newValue
    }
}

module.exports = {
    ready: db.ready,
    getPreferences,
    registerPreference,
    Preference
}