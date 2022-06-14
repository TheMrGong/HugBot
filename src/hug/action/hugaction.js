//@ts-check

const Discord = require("discord.js")
const commandHandler = require("../../command/commandhandler")

const config = require("../../config")
const lang = require("../../lang/lang")

const discordUtils = require("../../util/discordutil")
const energyApi = () => require("../energy/energyapi")
const hugRecords = () => require("../records/hugrecords")

const warned = require("../../warned")
const isBanned = require("../../banned")

const LIMIT_ON_SELF = 1000 * 60 * 5

const generateDirect = (name) => new RegExp(`^(?:${name}s? ?(?:<@(!?\\d+)>)) ?$|(?:(?:<@!?\\d+>) ${name}s?) ?$`, "gi")
const generateContext = (name) => new RegExp(`(?:\\_.*(${name})s? (.*)\\_)|(?:\\*.*(${name})s? (.*)\\*)|(?:(${name})s? (.*))|^(?:\\*(${name})s?\\*)$|^(?:(${name})s?)$`, "gi")
/*
HugAction.create(HugActions.HUG)
*/

/**
 * @typedef {Object} HugActionData
 * @property {string} id - Action name in the database
 * @property {number} energy - Amount of energy required to perform the action
 * @property {string} [group] - The group this action belongs to
 */

/**
 * @enum {HugActionData}
 */
const HugActions = {
    HUG: { // actually working
        id: "hug",
        energy: 0,
        group: "hug"
    },
    TACKLE_HUG: { // actually working
        id: "tacklehug",
        energy: 10,
        group: "hug"
    },
    PAT: { // all below gonna be implemented soon(tm)
        id: "pat",
        energy: 0
    },
    GLOMP: {
        id: "glomp",
        energy: 5,
        group: "hug"
    },
    HIGH_FIVE: {
        id: "highfive",
        energy: 2
    },
    FIST_BUMP: {
        id: "fistbump",
        energy: 1
    },
    POKE: {
        id: "poke",
        energy: 1 // maybe it detects the message above as the person you're poking
    },
    FLIRT: {
        id: "flirt",
        energy: 0
    },
    BOOP: {
        id: "boop",
        energy: 0
    },
    TICKLE: {
        id: "tickle",
        energy: 2
    }
}

/**
 * @callback ActionHandler
 * @param {Discord.Message} message
 * @param {Discord.GuildMember} applied
 * @returns {Promise<any>}
 */

class HugActionBuilder {
    /**
     * 
     * @param {HugActionData} action 
     */
    constructor(action) {
        this.action = action
        this.directRegex = generateDirect(action.id)
        this.contextRegex = generateContext(action.id)
        this.lang = lang.prefixed("actions." + action.id + ".")
        this.detectingAbove = false
        /**@type {"none"|"single"|"double"} */
        this.detectType = "none"

        /**@type {ActionHandler} */
        this.handler = async (message, affected) => { //todo leaderbaord

            const userMember = await message.guild.fetchMember(message.author)
            const userFaceP = discordUtils.profileToEmoji(message.author)

            const langBase = (userFace) => ["user", userMember.displayName, "userFace", userFace]

            if (!affected) {
                const msg = await message.channel.send(this.lang("fail", ...langBase("")))
                //@ts-ignore
                return// msg.edit(this.lang("fail", ...langBase(await userFaceP)))
            }

            const affectedFaceP = affected.id == message.author.id ? userFaceP : discordUtils.profileToEmoji(affected.user)

            const energy = this.action.energy == 0 ? true : await energyApi().useEnergy(message.guild.id, message.author.id, this.action.energy)

            const langArguments = (userFace, affectedFace) => [...langBase(userFace), "affected", affected.displayName, "affectedFace", affectedFace]

            const sendMessage = async (type) => {
                const msg = await message.channel.send(this.lang(...[type, ...langArguments("", "")]))
                //@ts-ignore
                //msg.edit(this.lang(...[type, ...langArguments(await userFaceP, await affectedFaceP)]))
            }
            if (!energy) {
                if (message.deletable) message.delete()
                return sendMessage("energy." + (affected.id == message.author.id ? "self" : "other"))
            }
            if (message.author.id == affected.id) // doing to themselves
                return sendMessage("self")
            else if (affected.id == message.client.user.id) // doing the bot
                return sendMessage("bot")
            if (message.deletable) message.delete()

            hugRecords().logAction(message.guild.id, message.author.id, affected.id, this.action)
            sendMessage("other")

            console.log(`{${message.guild.name}} "${userMember.displayName}"[${userMember.id}] did ${this.action.id} against ${affected.displayName}`)
        }
    }

    /**
     * @param {ActionHandler} handler 
     * @returns {HugActionBuilder}
     */
    actionHandler(handler) {
        this.handler = handler
        return this
    }

    /**
     * @param {"none"|"single"|"double"} detectType
     * @returns {HugActionBuilder}
     */
    detect(detectType) {
        this.detectType = detectType
        return this
    }

    /**
     * @param {string} emojiId 
     * @returns {HugActionBuilder}
     */
    emoji(emojiId) {
        this.emojiId = emojiId
        return this
    }

    /**
     * 
     * @param {string} emoji 
     * @returns {HugActionBuilder}
     */
    emojiText(emoji) {
        this.emojiString = emoji
        return this
    }

    /**
     * @returns {HugAction}
     */
    build() {
        return new HugAction(this)
    }
}

class HugAction {

    /**
     * @param {HugActionBuilder} builder 
     */
    constructor(builder) {
        this.data = builder
    }

    /**
     * @param {Discord.Client} client 
     */
    register(client) {
        const theData = this.data
        /**@type {commandHandler.Command} */
        const command = {
            cmd: this.data.action.id,

            /**
             * 
             * @param {Discord.Message} message 
             * @param {Array<string>} args 
             */
            async call(message, args) {
                if (args.length == 0) return theData.handler(message, await message.guild.fetchMember(message.client.user))
                theData.handler(message, await discordUtils.findMemberInEvent(message, args))
            }
        }

        const data = this.data

        /**@type {commandHandler.Command} */
        const statsCommand = {
            cmd: this.data.action.id + "s",

            /**
             * 
             * @param {Discord.Message} message 
             * @param {Array<string>} args 
             */
            async call(message, args) {
                if (message.deletable) message.delete()
                const statsLang = (key, ...args) => data.lang("stats." + key, ...args)
                const userFaceP = discordUtils.profileToEmoji(message.author)

                const userMember = await message.guild.fetchMember(message.author)

                let finding = args.length == 0 ? userMember : await discordUtils.findMemberInEvent(message, args)
                if (!finding) {

                    const findFail = (userFace) => data.lang("fail", "user", userMember.displayName, "userFace", userFace)
                    const msg = await message.channel.send(findFail(""))
                    //@ts-ignore
                    return //msg.edit(findFail(await userFaceP))
                }

                const stats = {
                    sent: await hugRecords().getTotalActions(message.guild.id, finding.id, true, data.action),
                    received: await hugRecords().getTotalActions(message.guild.id, finding.id, false, data.action)
                }

                if (finding.id == message.client.user.id) {
                    let lang = (userFace) => ["user", userMember.displayName, "userFace", userFace]
                    let key;
                    let additional = []
                    if (stats.received == 0)
                        key = "never-received"
                    else {
                        key = "has"
                        additional = ["actions", stats.received, "s", stats.received == 1 ? "" : "s"]
                    }
                    const generate = (userFace) => statsLang(...["bot." + key, ...lang(userFace), ...additional])
                    const msg = await message.channel.send(generate(""))
                    //@ts-ignore
                    //msg.edit(generate(await userFaceP))
                } else {
                    /**@type {"never-sent"|"never-received"|"never"|"has"} */
                    let type;

                    let statLang = []
                    if (stats.received > 0 && stats.sent > 0) {// has
                        type = "has"
                        statLang = ["sentActions", stats.sent, "sS", stats.sent == 1 ? "" : "s",
                            "receivedActions", stats.received, "rS", stats.received == 1 ? "" : "s"]
                    } else {
                        if (stats.received == 0 && stats.sent == 0) {
                            type = "never"
                        } else {
                            let statistic;
                            if (stats.sent == 0) { // 
                                type = "never-sent"
                                statistic = stats.received
                            } else if (stats.received == 0) {
                                type = "never-received"
                                statistic = stats.sent
                            }
                            statLang = ["actions", statistic, "s", statistic == 1 ? "" : "s"]
                        }
                    }

                    if (finding.id == message.author.id) { // self
                        let lang = (userFace) => ["user", userMember.displayName, "userFace", userFace, ...statLang]

                        const msg = await message.channel.send(statsLang("self." + type, ...lang("")))
                        //@ts-ignore
                        //msg.edit(statsLang("self." + type, ...lang(await userFaceP)))
                    } else { // other
                        const otherFaceP = discordUtils.profileToEmoji(finding.user)
                        let lang = (userFace, otherFace) => ["user", userMember.displayName, "userFace", userFace, "other", finding.displayName, "otherFace", otherFace, ...statLang]
                        const msg = await message.channel.send(statsLang("other." + type, ...lang("", "")))
                        //@ts-ignore
                        //msg.edit(statsLang("other." + type, ...lang(await userFaceP, await otherFaceP)))
                    }
                }
            }
        }

        /**
         * 
         * @param {Discord.Message} message 
         */
        const handler = async message => {
            if (!message.guild)
                return
            const prefix = config.customPrefixes[message.guild.id] || config.prefix
            if (message.cleanContent.startsWith(prefix)) return

            const mentioned = message.mentions.users.first()

            const us = await message.guild.fetchMember(message.client.user)

            const directFound = this.data.directRegex.exec(message.content)
            const contextFound = this.data.contextRegex.exec(message.cleanContent)

            if (directFound !== null && mentioned) { // @person hug
                if (isBanned(message.author.id)) {
                    message.channel.send(lang("banned", "userTag", message.author.toString()))
                } else {
                    this.data.handler(message, await message.guild.fetchMember(mentioned))

                    // should be always true, just for typescript being dumb
                    if (message.channel instanceof Discord.TextChannel && warned.toWarn.find(it => it == message.author.id)) warned.doWarning(message.author, message.channel)
                }
            } else if (contextFound !== null && !isBanned(message.author.id)) {
                const groups = []
                for (let k in contextFound) {
                    if (!isNaN(parseInt(k)) && contextFound[k] !== undefined) groups.push(contextFound[k])
                }
                const above = await discordUtils.getMessageAbove(message, LIMIT_ON_SELF)

                /**
                 * @param {Discord.GuildMember} [member]
                 */
                const handleAction = async (member) => {
                    const energyUsed = this.data.action.energy > 0 ? await energyApi().useEnergy(message.guild.id, message.author.id, this.data.action.energy) : true
                    if (!energyUsed) {
                        try {
                            message.react("🔋")
                        } catch (e) {
                            console.log("Unable to show energy error, no emojis")
                        }
                    } else {

                        if (member && member.id == message.author.id) this.data.handler(message, member) // show message for doing action to self
                        else {
                            hugRecords().logAction(message.guild.id, message.author.id, member ? member.id : above.author.id, this.data.action)
                        }

                        console.log("{" + message.guild.name + "} Detected action " + this.data.action.id + " from " + message.author.username + "[" + message.author.id + "] -> " + (member ? member.user.username : above.author.username) + " from context")
                        const channel = message.channel

                        const hasPermission = !(channel instanceof Discord.TextChannel) || channel.permissionsFor(us).has("ADD_REACTIONS")

                        if ((this.data.emojiId || this.data.emojiString) && hasPermission) try {
                            const emoji = this.data.emojiId ? await discordUtils.findEmojiGlobally(client, this.data.emojiId) : this.data.emojiString
                            if (member) await message.react(emoji)
                            if (!member) await above.react(emoji)
                        } catch (e) {
                            console.log("Unable to show reaction emojis for " + this.data.action.id + " emoji " + this.data.emojiId + " - " + e)
                        }
                    }
                }

                if (this.data.detectType == "single" && groups.length == 2 && above) {
                    handleAction()
                } else if (groups.length == 3) {
                    if (this.data.detectType == "double"
                        && groups[2].toLowerCase() == groups[1].toLowerCase()
                        && above) {
                        handleAction()
                    } else {
                        const members = discordUtils.findAllMembersInGuildMatching(message.guild, groups[2])
                        if (members.length == 1) handleAction(members[0])
                    }
                }
            }
        }
        client.on("message", handler)
        commandHandler.addCommand(client, command)
        commandHandler.addCommand(client, statsCommand)
    }
}

module.exports = {
    HugActions,
    HugActionBuilder
}
