//@ts-check
const Discord = require("discord.js")

const PAT_EMOJI_ID = "554662467352002589"
const LIMIT_ON_SELF = 1000 * 60 * 5

const { findAllMembersInGuildMatching, findMemberInEvent } = require("../../util/discordutil")
const hugrecords = require("../../hug/records/hugrecords")
const { HugActions } = require("../../hug/action/hugaction")

const rootLang = require("../../lang/lang")
const lang = rootLang.prefixed("cmd.pat.")
const config = require("../../config")
const discordUtil = require("../../util/discordutil")

const isBanned = require("../../banned")

/**
 * @param {Discord.Message} message 
 * @param {Discord.GuildMember} patting 
 */
async function patPerson(message, patting) {

    // patting self
    if (message.author.id == patting.id) {
        if (message.deletable) message.delete()
        return message.channel.send(lang("self", "user", message.author.toString()))
    }

    // log bot pats and patting others
    hugrecords.logAction(message.guild.id, message.author.id, patting.id, HugActions.PAT)

    // patting the bot
    if (patting.id == message.client.user.id)
        return message.channel.send(lang("bot", "user", message.author.toString()))
    else if (message.deletable) message.delete()
    // patting someone else
    message.channel.send(lang("other", "user", message.author.toString(), "patting", patting.displayName))
}

module.exports = {
    cmd: "pat",
    /**
     * @param {Discord.Message} message
     * @param {Array<string>} args
     */
    async call(message, args) {
        if (args.length == 0) return patPerson(message, await message.guild.fetchMember(message.client.user))
        const patting = await findMemberInEvent(message, args)
        if (!patting) return message.channel.send(lang("fail", "user", message.author.toString()))
        patPerson(message, patting)
    },

    /**
     * @param {Discord.Client} client
     */
    setup(client) {
        client.on("message", async message => {
            if (message.author.bot)
                return;
            if (message.cleanContent.startsWith(config.prefix)) return

            const regex = /\*?(?:pat)s?(?: pat)? (@?[a-zA-Z0-9]+)\*?/gmi
            const result = regex.exec(message.cleanContent)
            if (result !== null) {
                if (isBanned(message.author.id)) return
                const emoji = client.emojis.get(PAT_EMOJI_ID)
                if (result[1].toLowerCase() == "pat" || result[1].toLowerCase() == "patter") { // they're patting the user above

                    let messageAbove = await discordUtil.getMessageAbove(message, LIMIT_ON_SELF)

                    if (!messageAbove) return
                    await hugrecords.logAction(message.guild.id, message.author.id, messageAbove.author.id, HugActions.PAT)
                    if (!messageAbove.member) messageAbove.member = await messageAbove.guild.fetchMember(messageAbove.author)

                    console.log(`Patting ${messageAbove.member.displayName}`)
                    console.log(`Found message ${messageAbove.cleanContent}`)

                    try {
                        await message.react(emoji)
                        await messageAbove.react(emoji)
                    } catch (e) {
                        console.warn("Unable to do a pat!")
                        console.warn(e)
                    }
                } else {
                    const members = findAllMembersInGuildMatching(message.guild, result[1])
                    if (members.length == 1) {
                        const patting = members[0]
                        if (patting.id == message.client.user.id) return patPerson(message, patting)
                        await hugrecords.logAction(message.guild.id, message.author.id, patting.id, HugActions.PAT)
                        console.log("Figured out they were patting " + patting.displayName)
                        try {
                            await message.react(emoji)
                        } catch (e) {
                            console.warn("Unable to show the emoji :c")
                        }
                    }
                }
            }
        })
    }
}