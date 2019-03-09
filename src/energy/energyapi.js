//@ts-check
const db = require("./energydb")
const NodeCache = require("node-cache")
const Energy = require("./types")

const MAX_ENERGY = 30

const cache = new NodeCache({
    stdTTL: 60
})

/**
 * 
 * @param {string} guildId 
 * @param {string} userId 
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
 * @param {string} guildId 
 * @param {string} userId 
 * @param {number} [energy]
 * @returns {Promise<any>} mysql result packet
 */
async function addEnergy(guildId, userId, energy = 1) {
    if (energy == 0) return
    const currentEnergy = await getEnergyData(guildId, userId)
    if (currentEnergy.energy + energy < 0 || currentEnergy.energy > MAX_ENERGY) return

    updateCache(cacheKey(guildId, userId), cache => cache.energy = cache.energy + energy)
    let increasing = true
    if (energy < 0) {
        energy = energy * -1
        increasing = false
    }
    return await db.modifyEnergy(guildId, userId, energy, increasing)
}

/**
 * 
 * @param {string} guildId 
 * @param {string} userId 
 * @param {number} [energy]
 */
async function removeEnergy(guildId, userId, energy = 1) {
    if (energy == 0) return
    return await addEnergy(guildId, userId, energy * -1)
}

/**
 * @param {string} guildId 
 * @param {string} userId 
 * @param {number} energy 
 * @returns {Promise<boolean>} Whether the energy could be used
 */
async function useEnergy(guildId, userId, energy) {
    const energyData = await getEnergyData(guildId, userId)
    if (energyData.energy - energy <= 0) return false
    await removeEnergy(guildId, userId, energy)
    return true
}

/**
 * @param {string} guildId 
 * @param {string} userId 
 * @returns {Promise<Energy>}
 */
async function getEnergyData(guildId, userId) {
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
    getEnergyData,
    useEnergy,
    updateCache,
    cacheKey
}