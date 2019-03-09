//@ts-check

const Discord = require("discord.js")

const energyapi = require("./energyapi")
const energydb = require("./energydb")

const DECREMENT_EVERY = 1000 * 60

/**
 * @param {Discord.Client} client 
 */
function setup(client) {
    setInterval(async () => {
        const toUpdate = await energydb.getToDecrement(DECREMENT_EVERY)
        for (let guildId in toUpdate) {
            const userData = toUpdate[guildId]
            const guild = client.guilds.get(guildId)

            for (let k in userData) {
                const data = userData[k]
                try {
                    const user = await client.fetchUser(data.userId.toString())
                    const member = await guild.fetchMember(user)
                    //console.log(`[${guild.name}] Decrementing energy for ${member.displayName}, ${data.energy} => ${data.energy - 1}`)
                    energyapi.updateCache(energyapi.cacheKey(guildId, data.userId.toString()), cache => cache.energy = data.energy - 1)
                } catch (e) {
                    console.log(e)
                }
            }

        }

        await energydb.decrementAll(toUpdate)
    }, 1000)
    client.on("message", async message => {
        const regex = /^[A-Za-z 	0-9].*/gm
        if (!message.author.bot && regex.exec(message.content) !== null) {
            await energyapi.addEnergy(message.guild.id, message.author.id)
        }
    })
}

module.exports = {
    begin: setup
}