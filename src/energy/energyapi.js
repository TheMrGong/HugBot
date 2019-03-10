//@ts-check
const db = require("./energydb")
const Energy = require("./types")

const MAX_ENERGY = 30


/**
 * @param {string} guildId 
 * @param {string} userId 
 * @param {number} [energy]
 * @returns {Promise<any>} mysql result packet
 */
async function addEnergy(guildId, userId, energy = 1) {
    if (energy == 0) return
    const currentEnergy = await getEnergyData(guildId, userId)
    if (currentEnergy.energy + energy < 0 || currentEnergy.energy + energy > MAX_ENERGY) {
        console.log("Hit maximum energy.")
        return
    }

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
    return await db.getEnergy(guildId, userId)
}

module.exports = {
    ready: db.ready,
    addEnergy,
    removeEnergy,
    getEnergyData,
    useEnergy
}