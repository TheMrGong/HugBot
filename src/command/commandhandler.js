//@ts-check

const Discord = require("discord.js")
const config = require("../config/config.js");
const lang = require("../lang/lang.js")

/**
 * @callback call
 * @param {Discord.Message} event
 * @param {Array<string>} args
 * @returns {Promise<void>}
 */

/**
 * @callback setup
 * @param {Discord.Client} client
 */

/**
 * @typedef {Object} Command
 * @property {call} call
 * @property {string} cmd
 * @property {Array<string>} [alias]
 * @property {setup} [setup]
 */

/**@type {Array<Command>} */
const commands = []

/**
 * @param {Discord.Client} client
 * @param {string} name 
 */
function registerCommand(client, name) {
    /**@type {Command} */
    const command = require("./cmds/" + name)
    if (command.setup) command.setup(client)
    commands.push(command)
}

/**
 * @param {Discord.Client} client 
 * @param  {...string} cmds 
 */
function registerCommands(client, ...cmds) {
    cmds.forEach(c => registerCommand(client, c))
}

/**
 * 
 * @param {string} cmd 
 * @returns {Command|undefined}
 */
function findCommand(cmd) {
    cmd = cmd.toLowerCase()
    for (let k in commands) {
        const command = commands[k]
        if (command.cmd.toLowerCase() == cmd) return command
        if (command.alias) {
            for (let i in command.alias) {
                const alias = command.alias[i]
                if (alias.toLowerCase() == cmd) return command
            }
        }
    }
}

/**
 * @param {Discord.Client} client
 */
module.exports.setup = (client) => {
    client.on("message", event => {
        const possibleText = []
        commands.forEach(cmd => possibleText.push(config.prefix + cmd.cmd))
        if (event.author.bot
            && event.embeds[0]
            && event.embeds[0].description
            && possibleText.filter(it => event.embeds[0].description.toLowerCase().includes(it)).length > 0) {
            if (event.deletable) event.delete()
            return
        }
        if (event.author.bot)
            return;

        if (!event.content.toLowerCase().startsWith(config.prefix)) {
            return
        }

        const spaces = event.content.split(" ");
        const cmd = spaces[0].toLowerCase().substring(1, spaces[0].length).replace(/[^\w]/gm, "")
        const args = [];
        for (let k in spaces) {
            if (parseInt(k) > 0) args.push(spaces[k]);
        }
        const command = findCommand(cmd)
        if (command) command.call(event, args)
    });

    registerCommands(client, "hugcmd", "hugstatscmd", "tacklehugcmd", "energycmd", "test")
}