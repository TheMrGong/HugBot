//@ts-check

const readline = require("readline")
const Discord = require("discord.js")

/**
 * @param {Discord.Client} client 
 */
function begin(client) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });
    const type = 1 // 1 stew, 2 other
    const stewID = type == 0 ? "457601288113487897" : type == 1 ? "481910869282783235" : type == 2 ? "264714814172037120" : "wat"
    const stewGeneral = type == 0 ? "554127353601720340" : type == 1 ? "481910869282783237" : type == 2 ? "264714814172037120" : "wat"
    const stewGuild = client.guilds.get(stewID)
    const general = stewGuild.channels.get(stewGeneral)
    rl.prompt()
    rl.on("line", line => {
        if (general instanceof Discord.TextChannel)
            general.send(line)
        rl.prompt()
    }).on("exit", () => process.exit(0))
}

module.exports = {
    begin
}