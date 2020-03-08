//@ts-check

const Discord = require("discord.js")
const config = require("../config");

const rootLang = require("../lang/lang")
const isBanned = require("../banned")
const warned = require("../warned")

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
 * @param {Command} command 
 */
function addCommand(client, command) {
    if (command.setup) command.setup(client)
    commands.push(command)
}

/**
 * @param {Discord.Client} client
 * @param {string} name 
 */
function registerCommand(client, name) {
    addCommand(client, require("./cmds/" + name))
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

module.exports = {
    commands,
    /**
     * @param {Discord.Client} client
     */
    setup(client) {
        client.on("message", message => {
            const possibleText = []
            commands.forEach(cmd => possibleText.push(config.prefix + cmd.cmd))
            if (message.author.bot
                && message.embeds[0]
                && message.embeds[0].description
                && possibleText.filter(it => message.embeds[0].description.toLowerCase().includes(it)).length > 0) {
                if (message.deletable) message.delete()
                return
            }
            if (message.author.bot)
                return;

            if (!message.content.toLowerCase().startsWith(config.prefix)) {
                return;
            }

            const spaces = message.content.split(" ");
            const cmd = spaces[0].toLowerCase().substring(1, spaces[0].length).replace(/[^\w]/gm, "")
            const args = [];
            for (let k in spaces) {
                if (parseInt(k) > 0) args.push(spaces[k]);
            }
            const command = findCommand(cmd)
            if (command) {
                if (isBanned(message.author.id)) {
                    message.channel.send(rootLang("banned", "userTag", message.author.toString()))
                } else {
                    command.call(message, args).catch(e => console.warn("Error handling command " + cmd, e)).then(() => {
                        if (warned.toWarn.find(it => it == message.author.id) && message.channel instanceof Discord.TextChannel) {
                            warned.doWarning(message.author, message.channel)
                        }
                    })

                }
            }
        });

        registerCommands(client, "tacklehugcmd", "energycmd", "patcmd", "hughelpcmd", "giftestcmd", "flirtcmd", "gnomepointcmd", "heartcmd", "adultcmd")
    },
    addCommand
}