//@ts-check
const Discord = require("discord.js")
const lang = require("../../lang/lang").prefixed("cmd.help.")

module.exports = {
    cmd: "hughelp",
    /**
     * @param {Discord.Message} event
     * @param {Array<string>} args
     */
    async call(event, args) {
        event.channel.send(lang("msg"))
    }
}