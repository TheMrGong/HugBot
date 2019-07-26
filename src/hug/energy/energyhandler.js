//@ts-check

const Discord = require("discord.js")

const energyapi = require("./energyapi")
const energydb = require("./energydb")

const DECREMENT_EVERY = 1000 * 60 * 5

/**
 * @param {Discord.Client} client 
 */
function setup (client) {
    setInterval(async () => {
        const toUpdate = await energydb.getToDecrement(DECREMENT_EVERY)

        await energydb.decrementAll(toUpdate)
    }, 1000)
    client.on("message", async message => {
        const regex = /^[A-Za-z 	0-9].*/gm
        if (!message.author.bot && regex.exec(message.content) !== null && message.guild && message.author) {
            await energyapi.addEnergy(message.guild.id, message.author.id)
        }
    })
}

module.exports = {
    begin: setup
}