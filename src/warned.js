//@ts-check

const Discord = require("discord.js")
const lang = require("./lang/lang")
let toWarn = []

/**
 * 
 * @param {Discord.User} user 
 * @param {Discord.TextChannel} channel 
 */
function doWarning(user, channel) {
    const msg = lang("warned", "userTag", user.toString())
    channel.send(msg).catch(e => console.warn("Unable to send warning message"))
    console.log("Showed warning for user " + user.username)
    const index = toWarn.indexOf(user.id)
    if (index != -1) toWarn.splice(index, 1)
    else console.warn("Unable to remove warning, not found in array")
}

module.exports = {
    toWarn,
    doWarning
}