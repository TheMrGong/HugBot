//@ts-check
const db = require("./energydb")
const NodeCache = require("node-cache")
const Energy = require("./types")

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

/**
 * @param {string} key 
 * @param {function(Object): void} apply 
 */
function updateCache(key, apply) {
    const cachedValue = cache.get(key)
    if (typeof cachedValue == "object") {
        apply(cachedValue)
        cache.set(key, cachedValue)
    }
}

/**
 * @param {number} guildId 
 * @param {number} userId 
 * @param {number} [energy]
 * @returns {Promise<any>} mysql result packet
 */
async function addEnergy(guildId, userId, energy = 1) {
    if (energy == 0) return
    updateCache(cacheKey(guildId, userId), cache => cache.energy + energy)
    let increasing = true
    if (energy < 0) {
        energy = energy * -1
        increasing = false
    }

    return await db.modifyEnergy(guildId, userId, energy, increasing)
}

/**
 * 
 * @param {number} guildId 
 * @param {number} userId 
 * @param {number} [energy]
 */
async function removeEnergy(guildId, userId, energy = 1) {
    if (energy == 0) return
    return await addEnergy(guildId, userId, energy * -1)
}

/**
 * @param {number} guildId 
 * @param {number} userId 
 * @returns {Promise<Energy>}
 */
async function getEnergy(guildId, userId) {
    const cached = cache.get(cacheKey(guildId, userId))
    if (typeof cached == "object") return cached
    const energy = await db.getEnergy(guildId, userId)
    cache.set(cacheKey(guildId, userId), energy)

    return energy
}

module.exports = {
    ready: db.ready,
    addEnergy,
    removeEnergy,
    getEnergy
}