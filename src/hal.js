//@ts-check


const readline = require("serverline")
const Discord = require("discord.js")
const warned = require("./warned")

/**
 * @param {Discord.Client} client 
 */
function begin(client) {
    //process.stdout.write("\x1Bc")
    //console.log(Array(process.stdout.rows + 1).join('\n'));
    readline.init()
    readline.getRL().question("> ", createOnResponse(client))
}

/**
 * 
 * @param {Discord.Client} client 
 */
function createOnResponse(client) {
    return function onResponse(line) {
        const args = line.split(" ")
        const cmd = args.shift()
        if (cmd.toLowerCase() == "warn") {
            if (args.length !== 1) return console.log("Invalid usage. Usage: warn <ID>")
            client.fetchUser(args[0]).then(user => {
                warned.toWarn.push(user.id)
                console.log(`Scheduled ${user.username} to be warned`)
            }).catch(e => console.warn("User not found", e))
        }
        readline.getRL().question("> ", onResponse);
    }

}


module.exports = {
    begin
}