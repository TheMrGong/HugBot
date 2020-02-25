//@ts-check
const request = require("snekfetch")
const Discord = require("discord.js")
const config = require("./config")

const HOST = "https://discord.bots.gg/api/v1"
const ENDPOINT = "/bots/ID/stats"

/**
 * @param {Discord.Client} bot 
 */
module.exports = function setup(bot) {
    const endpoint = ENDPOINT.replace("ID", bot.user.id)
    const update = () => sendStatistics(endpoint, bot).catch(e => console.warn("Failed to send statistics", e))
    update()

    bot.on("guildCreate", guild => {
        console.log("Joined a new guild: " + guild.name + ", now on " + bot.guilds.size + " guilds!");
        update()
    })

    bot.on("guildDelete", guild => {
        console.log("Left a guild: " + guild.name);
        update()
    })
}

/**
 * 
 * @param {string} endpoint 
 * @param {Discord.Client} bot 
 */
async function sendStatistics(endpoint, bot) {
    return new Promise((resolve, reject) => {
        request.post(HOST + endpoint, {
            headers: {
                "Authorization": config.discordgg,
                "Content-Type": "application/json"
            }
        }).send({ guildCount: bot.guilds.size })
            .then(r => {
                resolve(r.body)
            }).catch(e => reject(e))
    })

}