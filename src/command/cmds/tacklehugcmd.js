//@ts-check
const Discord = require("discord.js")
const findMemberInEvent = require("../util")
const lang = require("../../lang/lang.js")
const tackleHug = require("../../tacklehug")

module.exports = {
    cmd: "tacklehug",
    alias: ["hugtackle"],
    /**
     * @param {Discord.Message} event
     * @param {Array<string>} args
     */
    async call(event, args) {
        if (args.length == 0) return event.channel.send(lang("hug-tackle.unspecified", "user", event.author.toString()))

        const member = await findMemberInEvent(event, args)
        const tackling = args.join(" ")

        if (!member) return event.channel.send(lang("hug-tackle.not-found", "user", event.author.toString(), "tackling", tackling))
        if (member.id == event.author.id) return event.channel.send(lang("hug-tackle.self", "user", event.author.toString()))

        event.delete()
        tackleHug.beginTackleHug(event, member)
    },

    /**
     * @param {Discord.Client} client
     */
    setup(client) {
        tackleHug.setup(client)
    }
}