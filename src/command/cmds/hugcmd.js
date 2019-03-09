//@ts-check
const Discord = require("discord.js")
const findMemberInEvent = require("../util")
const lang = require("../../lang/lang.js")
const config = require("../../config/config.js");
const hugrecords = require("../../records/hugrecords"),
    Action = hugrecords.Action

/**
 * 
 * @param {Discord.Message} event 
 */
function hugTheBot(event) {
    const replyingWith = lang(
        "bot-hugs",
        "user",
        event.author.toString()
    );
    console.log(
        event.member.displayName + " hugged me! Replying with " + replyingWith
    );
    event.channel.send(replyingWith)
    hugrecords.logAction(event.guild.id, event.author.id, event.client.user.id, Action.HUG)
}

/**
 * 
 * @param {Discord.Message} event 
 * @param {Discord.User} user 
 */
function hugUser(event, user) {
    if (event.author.id === user.id) {
        if (event.deletable) event.delete()
        event.channel.send(
            lang("hug-self", "user", event.author.toString())
        );
        return;
    } else if (user.id === event.client.user.id) return hugTheBot(event);
    if (event.deletable) event.delete()

    hugrecords.logAction(event.guild.id, event.author.id, user.id, Action.HUG)

    if (event.mentions.users.array().length > 0) {
        event.channel.send(
            lang("hug-other", "hugger", event.author.toString(), "hugged", user.toString())
        );
    } else {
        event.guild.fetchMember(user).then(member => {
            event.channel.send(
                lang("hug-other", "hugger", event.author.toString(), "hugged", `\`\`${member.displayName}\`\``)
            );
        })
    }

    console.log(event.member.displayName + " has hugged " + user.username);
}

/**
 * 
 * @param {Discord.Message} event 
 */
function processHugsInMessage(event) {
    const mentioned = event.mentions.members.first()

    const lower = event.content.toLowerCase()
    const regex = /(?: ?<@!\d+> ?)?\bhug\b(?: ?<@!\d+> ?)?/gm

    if (regex.exec(lower) !== null && mentioned)
        hugUser(event, mentioned.user)
}

module.exports = {
    cmd: "hug",
    /**
     * 
     * @param {Discord.Message} event 
     * @param {Array<string>} args 
     */
    async call(event, args) {
        if (args.length == 0) return hugTheBot(event)
        const targetting = args.join(" ")
        const member = await findMemberInEvent(event, args)
        if (member) hugUser(event, member.user)
        else event.channel.send(
            lang("hug-fail", "user", event.author.toString(), "hugging", targetting)
        );
    },
    /**
     * @param {Discord.Client} client
     */
    setup(client) {
        client.on("message", event => {
            if (event.author.bot)
                return;

            if (!event.content.toLowerCase().startsWith(config.prefix)) {
                return processHugsInMessage(event)
            }
        })
    }
}