//@ts-check
const Discord = require("discord.js")
const hugrecords = require("../../records/hugrecords")


module.exports = {
    cmd: "test",
    /**
     * 
     * @param {Discord.Message} event 
     * @param {Array<string>} args 
     */
    async call(event, args) {
        hugrecords.getTotalActions("0", "1", true, hugrecords.Action.TACKLE_HUG)
    }

}