//@ts-check
const Discord = require("discord.js")
const lang = require("../../lang/lang").prefixed("cmd.adult.")

module.exports = {
    cmd: "adult",
    /**
     * @param {Discord.Message} event
     * @param {Array<string>} args
     */
    async call (event, args) {
        const originalNick = event.guild.me.nickname

        const changeNick = async (isAdult) => {
            try {
                await event.guild.me.setNickname(isAdult ? "Adult" : originalNick)
            } catch (e) { }
        }
        await changeNick(true)
        await event.channel.send(lang("responses"))
        await changeNick(false)
    }
}