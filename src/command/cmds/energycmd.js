//@ts-check

const Discord = require("discord.js")
const findMemberInEvent = require("../util")
const lang = require("../../lang/lang.js").prefixed("cmd.energy.")

const energyapi = require("../../energy/energyapi")

const DELETE_AFTER = 1000 * 30



/**
 * @param {Discord.Message} event 
 * @param {Discord.GuildMember} member 
 */
async function showEnergy(event, member) {
    if (event.deletable) event.delete()
    const energy = Math.floor((await energyapi.getEnergyData(event.guild.id, member.id)).energy)
    // getting energy of self
    /**@type {Discord.Message|Discord.Message[]} */
    let message;


    if (event.author.id == member.id) {
        if (energy == 0) message = await event.channel.send(lang("self.no-energy", "user", event.author.toString()))
        else message = await event.channel.send(lang("self.energy", "user", member.displayName, "energy", energy))
    } else if (member.id == event.client.user.id) { // energy of bot
        message = await event.channel.send(lang("bot", "user", event.member.displayName))
    } else {
        if (energy == 0) message = await event.channel.send(lang("other.no-energy", "user", event.author.toString(), "finding", member.displayName))
        else message = await event.channel.send(lang("other.energy", "user", event.author.toString(), "finding", member.displayName, "energy", energy))
    }
    if (message instanceof Discord.Message) message.delete(DELETE_AFTER)
}

module.exports = {
    cmd: "energy",
    /**
     * @param {Discord.Message} event
     * @param {Array<string>} args
     */
    async call(event, args) {
        if (args.length == 0)
            return showEnergy(event, event.member)
        const targetting = args.join(" ")
        const member = await findMemberInEvent(event, args)
        if (member) showEnergy(event, member)
        else event.channel.send(
            lang("fail", "user", event.author.toString(), "hugging", targetting)
        );
    }
}