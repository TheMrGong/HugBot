//@ts-check
const Discord = require("discord.js")
const { findMemberInEvent } = require("../../util/discordutil")
const lang = require("../../lang/lang.js").prefixed("cmd.hug.")
const config = require("../../config");
const hugrecords = require("../../hug/records/hugrecords")
const { HugActions } = require("../../hug/action/hugaction")
const energyapi = require("../../hug/energy/energyapi")
const discordUtil = require("../../util/discordutil")

const SPECIAL_HUGS = {
    "263675970270003200": [
        "This hug has the love of all those who love your stories *beware of spinal damage*",
        "Hug bot hands you a note before the hug \"From the discorders, we love you man\""
    ]
}

/**
 * 
 * @param {Discord.Message} event 
 */
async function hugTheBot(event) {

    let specialHugs;
    for (let userId in SPECIAL_HUGS) {
        if (event.member.id == userId) specialHugs = SPECIAL_HUGS[userId]
    }
    if (specialHugs) {
        event.channel.send(specialHugs[Math.floor(Math.random() * specialHugs.length)])
        console.log("Using a special hug!")
        return
    }
    const userEmoji = await discordUtil.profileToEmoji(event.author)
    const replyingWith = lang(
        "bot-hugs",
        "user",
        event.author.toString(),
        "userFace",
        userEmoji.toString()
    );
    console.log(
        event.member.displayName + " hugged me! Replying with " + replyingWith
    );
    event.channel.send(replyingWith)
    hugrecords.logAction(event.guild.id, event.author.id, event.client.user.id, HugActions.HUG)
}

/**
 * 
 * @param {Discord.Message} event 
 * @param {Discord.User} user 
 */
async function hugUser(event, user) {
    const member = await event.guild.fetchMember(user)

    const energyUsed = await energyapi.useEnergy(event.guild.id, event.author.id, HugActions.HUG.energy)
    const huggerEmoji = await discordUtil.profileToEmoji(event.author)
    if (!energyUsed) {
        if (event.deletable) event.delete()
        return event.channel.send(
            lang("not-enough-energy", "user", event.author.toString(), "userFace", huggerEmoji.toString(), "attempt", member.displayName)
        )
    }
    if (event.author.id === user.id) { // if they're hugging themselves
        if (event.deletable) event.delete()
        event.channel.send(
            lang("hug-self", "user", event.author.toString(), "userFace", huggerEmoji.toString())
        );
        return;
        // if they're hugging us
    } else if (user.id === event.client.user.id) return hugTheBot(event);
    if (event.deletable) event.delete()
    const huggedEmoji = await discordUtil.profileToEmoji(user)

    // put in the database this happened
    hugrecords.logAction(event.guild.id, event.author.id, user.id, HugActions.HUG)

    event.channel.send(
        lang("hug-other", "hugger", event.author.toString(), "huggerFace", huggerEmoji.toString(), "hugged", `\`\`${member.displayName}\`\``, "huggedFace", huggedEmoji.toString())
    );

    console.log(event.guild.name + " - " + event.member.displayName + " has hugged " + user.username);
}

/**
 * 
 * @param {Discord.Message} event 
 */
async function processHugsInMessage(event) {
    const mentioned = event.mentions.users.first()

    const lower = event.content.toLowerCase()
    const regexLeft = /^(?: ?<@!?\d+> ?) ?hug$/gm
    const regexRight = /^hug(?: ?<@!?\d+> ?)$/gm

    if ((regexLeft.exec(lower) !== null || regexRight.exec(lower) !== null) && mentioned)
        hugUser(event, mentioned)
}

module.exports = {
    cmd: "hug",
    /**
     * 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     */
    async call(message, args) {
        if (args.length == 0) return hugUser(message, message.client.user)
        const targetting = args.join(" ")
        const member = await findMemberInEvent(message, args)
        if (member) hugUser(message, member.user)
        else {
            const userEmoji = await discordUtil.profileToEmoji(message.author)
            message.channel.send(
                lang("fail", "user", message.author.toString(), "userFace", userEmoji.toString(), "hugging", targetting)
            );
        }
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