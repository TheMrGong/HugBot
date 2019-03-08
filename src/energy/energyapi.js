//@ts-check
const db = require("./energydb")
const NodeCache = require("node-cache")

const cache = new NodeCache({
    stdTTL: 60
})

/**
 * 
 * @param {number} guildId 
 * @param {number} userId 
 * @returns {string}
 */
function cacheKey(guildId, userId) {
    return `${guildId}:${userId}`
}

async function addEnergy(guildId, userId, energy) {
    const cachedValue = cache.get(cacheKey(guildId, energy))
}

module.exports = {
    ready: db.ready
}