//@ts-check
const Discord = require("discord.js")
const hugrecords = require("../../records/hugrecords")
const energydb = require("../../energy/energydb")

module.exports = {
    cmd: "test",
    /**
     * 
     * @param {Discord.Message} event 
     * @param {Array<string>} args 
     */
    async call(event, args) {
        const things = await energydb.getToDecrement(0)
        energydb.decrementAll(things)
    }

}