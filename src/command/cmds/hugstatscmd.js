//@ts-check
const Discord = require("discord.js")
const findMemberInEvent = require("../util")
const lang = require("../../lang/lang.js")
const storage = require("../../storage")

const DELETE_AFTER = 1000 * 10

/**
 * 
 * @param {Discord.Message} event 
 * @param {Discord.GuildMember} member 
 */
async function showHugStatsFor(event, member) {
    const stats = await storage.getUserInfo(event.guild.id, member.id)
    const self = event.author.id === member.id
    if (!stats) {
        const message = await event.channel.send(lang(self ? "hug-stats-self-never" : "hug-stats-never-hugged", "user", event.author.toString(), "found", member.displayName))
        if (message instanceof Discord.Message && message.deletable) message.delete(DELETE_AFTER)
        return
    }
    const hugs = stats.hugsReceived + " hug" + (stats.hugsReceived == 1 ? "" : "s")

    /**@type {Discord.Message|Discord.Message[]} */
    let message;
    if (self)
        message = await event.channel.send(lang("hug-stats-self-received", "user", event.author.toString(), "hugs", hugs))
    else message = await event.channel.send(lang("hug-stats-other-received", "user", event.author.toString(), "hugs", hugs, "found", member.displayName))

    if (message instanceof Discord.Message && message.deletable) message.delete(DELETE_AFTER)
}

module.exports = {
    cmd: "hugs",
    /**
     * @param {Discord.Message} event
     * @param {Array<string>} args
     */
    async call(event, args) {
        if (event.deletable)
            event.delete()
        if (args.length == 0) {
            showHugStatsFor(event, event.member);
        } else {
            const targetting = args.join(" ")
            const member = await findMemberInEvent(event, args)
            if (member)
                showHugStatsFor(event, member)
            else event.channel.send(
                lang("hug-stats-nofind", "user", event.author.toString(), "finding", targetting)
            );
        }
    }
}