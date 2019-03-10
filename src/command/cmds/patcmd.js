//@ts-check
const Discord = require("discord.js")
const { findAllMembersInGuildMatching, findMemberInEvent } = require("../util")
const hugrecords = require("../../database/records/hugrecords"),
    Action = hugrecords.Action
const lang = require("../../lang/lang").prefixed("cmd.pat.")

const PAT_EMOJI_ID = "554304005946212358"
const LIMIT_ON_SELF = 1000 * 60 * 5

/**
 * @param {Discord.Message} message 
 * @param {Discord.GuildMember} patting 
 */
async function patPerson(message, patting) {
    // patting self
    if (message.author.id == patting.id)
        return message.channel.send(lang("self", "user", message.author.toString()))

    // log bot pats and patting others
    hugrecords.logAction(message.guild.id, message.author.id, patting.id, Action.PAT)

    // patting the bot
    if (patting.id == message.client.user.id)
        return message.channel.send(lang("bot", "user", message.author.toString()))
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
            const regex = /\*?(?:pat(?:ter)?)s?(?: pat)? (@?\w+)\*?/gmi
            const result = regex.exec(message.cleanContent)
            if (result !== null) {
                const emoji = client.emojis.get(PAT_EMOJI_ID)
                if (result[1].toLowerCase() == "pat" || result[1].toLowerCase() == "patter") { // they're patting the user above
                    const messages = (await message.channel.fetchMessages({ limit: 20, before: message.id })).array().sort((a, b) => b.createdTimestamp - a.createdTimestamp)
                    /**@type {Discord.Message} */

                    let respondingTo;

                    for (let k in messages) {
                        /**@type {Discord.Message} */
                        const pastMessage = messages[k]
                        const millisecondsPassed = new Date().getTime() - pastMessage.createdTimestamp
                        if (pastMessage.author.id == message.author.id && millisecondsPassed > LIMIT_ON_SELF) {
                            console.log("Breaking.")
                            break; // message is too far in the past
                        }
                        if (pastMessage.author.bot) continue
                        if (pastMessage.author.id != message.author.id) {
                            respondingTo = pastMessage
                            break
                        }
                    }

                    if (!respondingTo) return
                    await hugrecords.logAction(message.guild.id, message.author.id, respondingTo.author.id, Action.PAT)
                    message.react(emoji)
                    respondingTo.react(emoji)
                    console.log(`Patting ${respondingTo.member.displayName}`)
                    console.log(`Found message ${respondingTo.cleanContent}`)
                } else {
                    const members = findAllMembersInGuildMatching(message.guild, result[1])
                    if (members.length == 1) {
                        const patting = members[0]
                        if (patting.id == message.client.user.id) return patPerson(message, patting)
                        await hugrecords.logAction(message.guild.id, message.author.id, patting.id, Action.PAT)
                        await message.react(emoji)
                        console.log("Figured out they were patting " + patting.displayName)
                    }
                }
            }
        })
    }
}