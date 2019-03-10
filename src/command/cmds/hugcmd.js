//@ts-check
const Discord = require("discord.js")
const { findMemberInEvent } = require("../util")
const lang = require("../../lang/lang.js").prefixed("cmd.hug.")
const config = require("../../config");
const hugrecords = require("../../database/records/hugrecords"),
    Action = hugrecords.Action
const energyapi = require("../../database/energy/energyapi")

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
function hugTheBot(event) {

    let specialHugs;
    for (let userId in SPECIAL_HUGS) {
        if (event.member.id == userId) specialHugs = SPECIAL_HUGS[userId]
    }
    if (specialHugs) {
        event.channel.send(specialHugs[Math.floor(Math.random() * specialHugs.length)])
        console.log("Using a special hug!")
        return
    }
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
async function hugUser(event, user) {
    const member = await event.guild.fetchMember(user)

    const energyUsed = await energyapi.useEnergy(event.guild.id, event.author.id, Action.HUG.energy)
    if (!energyUsed) {
        if (event.deletable) event.delete()
        return event.channel.send(
            lang("not-enough-energy", "user", event.author.toString(), "attempt", member.displayName)
        )
    }
    if (event.author.id === user.id) { // if they're hugging themselves
        if (event.deletable) event.delete()
        event.channel.send(
            lang("hug-self", "user", event.author.toString())
        );
        return;
        // if they're hugging us
    } else if (user.id === event.client.user.id) return hugTheBot(event);
    if (event.deletable) event.delete()

    // put in the database this happened
    hugrecords.logAction(event.guild.id, event.author.id, user.id, Action.HUG)

    event.channel.send(
        lang("hug-other", "hugger", event.author.toString(), "hugged", `\`\`${member.displayName}\`\``)
    );

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
        if (args.length == 0) return hugUser(event, event.client.user)
        const targetting = args.join(" ")
        const member = await findMemberInEvent(event, args)
        if (member) hugUser(event, member.user)
        else event.channel.send(
            lang("fail", "user", event.author.toString(), "hugging", targetting)
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