
class Energy {
    /**
     * 
     * @param {number} energy - amount of energy
     * @param {number} lastRemoved - last time energy was decreased
     */
    constructor(energy, lastRemoved) {
        this.energy = energy
        this.lastRemoved = lastRemoved
    }
}

module.exports = Energy