//@ts-check
const Discord = require("discord.js")
const lang = require("../../lang/lang").prefixed("cmd.help.")

const commandHandler = () => require("../commandhandler")
const config = require("../../config")

module.exports = {
    cmd: "hughelp",
    /**
     * @param {Discord.Message} event
     * @param {Array<string>} args
     */
    async call(event, args) {
        const shownCommands = commandHandler().commands.filter(e => e["s"] !== true)
        const configPrefix = config.customPrefixes[event.guild.id] || config.prefix
        const prefix = `\`${configPrefix}\``

        const lastOfList = shownCommands.pop().cmd
        const listWithoutLast = shownCommands.map(cmd => cmd.cmd).join(", ")

        const lastWithPrefix = prefix + lastOfList
        const listWithPrefix = shownCommands.map(cmd => prefix + cmd.cmd).join(", ")

        const list = listWithoutLast + ", " + lastOfList

        event.channel.send(lang("msg",
            "lastOfList", lastOfList,
            "listWithoutLast", listWithoutLast,
            "lastWithPrefix", lastWithPrefix,
            "listWithPrefix", listWithPrefix,
            "list", list,
            "prefix", prefix))
    }
}