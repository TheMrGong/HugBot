//@ts-check
const Discord = require("discord.js")
const findMemberInEvent = require("../util")

const PREFIX = "cmd.tacklehug."
const langAPI = require("../../lang/lang.js"),
    lang = langAPI.prefixed(PREFIX)

const hugrecords = require("../../records/hugrecords"),
    Action = hugrecords.Action
const tacklehugRecords = require("../../records/tacklehugrecords"),
    TackleResult = tacklehugRecords.TackleResult

//TODO dodge fail
const energyapi = require("../../energy/energyapi")

/**
 * @enum {number}
 */
const HUG_STATE = {
    WAITING: 0,
    DODGED: 1,
    ACCEPTED: 2,
    TOO_LONG: 3,
}

/**@type {Array<TackleData>} */
let tacklehugs = []

const D_EMOTE = "🇩"
const A_EMOTE = "🅰"

const TIME_TO_DODGE = 1000 * 10
const MESSAGE_EXIST_FOR = 1000 * 13
const DELETING = false

const TACKLING_KEY = "tackling."

/**
 * @typedef {Object} TackleData
 * @property {string} tacklerId
 * @property {string} tackledId
 * @property {HUG_STATE} state
 * @property {number} begin
 * @property {number} solidified
 * @property {number} countdownIndex
 * @property {boolean} updating
 * @property {boolean} doneUpdating
 * @property {number} timeLeft
 * @property {boolean} shouldRemove
 * @property {function(): void} delete
 * @property {function(): void} updateMessage
 * @property {number} insertId
 */

/**
 * @param {string} tacklerId 
 * @returns {boolean}
 */
function isCurrentlyTackling(tacklerId) {
    return tacklehugs.filter(data => data.tacklerId == tacklerId && !data.shouldRemove).length > 0
}

/**
 * @param {string} tackledId 
 * @returns {TackleData}
 */
function findTackledData(tackledId) {
    return tacklehugs.filter(data => data.tackledId == tackledId)[0]
}

setInterval(() => {
    for (let k in tacklehugs) {
        const tacklehug = tacklehugs[k]
        if (!tacklehug.shouldRemove) tacklehug.updateMessage()
    }
    tacklehugs = tacklehugs.filter(async data => {
        if (data.shouldRemove) {
            if (data.state == HUG_STATE.TOO_LONG)
                tacklehugRecords.insertTackleHugInfo(data.insertId, TackleResult.TOO_LONG, -1)
            if (DELETING) data.delete()
            return false
        }
        return true
    })
}, 2000)

module.exports = {
    cmd: "tacklehug",
    alias: ["hugtackle"],
    /**
     * @param {Discord.Message} event
     * @param {Array<string>} args
     */
    async call(event, args) {
        if (args.length == 0) return event.channel.send(lang("unspecified", "user", event.author.toString()))

        const member = await findMemberInEvent(event, args)
        const tackling = args.join(" ")

        if (!member) return event.channel.send(lang("not-found", "user", event.author.toString(), "tackling", tackling))
        if (member.id == event.author.id) return event.channel.send(lang("self", "user", event.author.toString()))

        if (event.deletable) event.delete()
        const energyUsed = await energyapi.useEnergy(event.guild.id, event.author.id, Action.TACKLE_HUG.energy)
        if (!energyUsed)
            return event.channel.send(
                lang("not-enough-energy", "user", event.author.toString(), "attempt", member.displayName)
            )
        beginTackleHug(event, member)
    },

    /**
     * @param {Discord.Client} client
     */
    setup(client) {
        client.on("messageReactionAdd", async (reaction, user) => {
            if (user.bot) return
            const tackledData = findTackledData(user.id)
            if (!tackledData) return

            if (tackledData.state == HUG_STATE.WAITING) {

                async function insertData(tackleResult) {
                    await tacklehugRecords.insertTackleHugInfo(tackledData.insertId, tackleResult, tackledData.solidified)
                }
                if (reaction.emoji.name == D_EMOTE) {
                    tackledData.state = HUG_STATE.DODGED
                    tackledData.solidified = tackledData.timeLeft
                    await insertData(TackleResult.DODGED)

                    tackledData.updateMessage()
                } else if (reaction.emoji.name == A_EMOTE) {
                    tackledData.state = HUG_STATE.ACCEPTED
                    tackledData.solidified = tackledData.timeLeft
                    await insertData(TackleResult.ACCEPTED)
                    tackledData.updateMessage()

                }
            }
        })
    }
}

/**
 * 
 * @param {string} tackler 
 * @param {string} tackled 
 * @param {HUG_STATE} state 
 * @param {number} timeLeft 
 * @param {number} [countdownIndex]
 * @returns {(string|langAPI.TranslateResult)}
 */
function generateMessage(tackler, tackled, state, timeLeft, countdownIndex = -1) {
    const time = timeLeft + " second" + (timeLeft == 1 ? "" : "s")
    switch (state) {
        case HUG_STATE.WAITING:
            return langAPI.withIndex(PREFIX + TACKLING_KEY + "time-left", "tackled", tackled, "tackler", tackler, "time", time, "$$index", countdownIndex)
        case HUG_STATE.DODGED:
            return lang(TACKLING_KEY + "dodged", "tackled", tackled, "tackler", tackler, "time", time)
        case HUG_STATE.ACCEPTED:
            return lang(TACKLING_KEY + "accepted", "tackled", tackled, "tackler", tackler, "time", time)
        case HUG_STATE.TOO_LONG:
            return lang(TACKLING_KEY + "too-long", "tackled", tackled, "tackler", tackler)
    }
    return "wat?"
}

/**
 * 
 * @param {Discord.Message} event 
 * @param {Discord.GuildMember} tackling 
 */
async function beginTackleHandling(event, tackling) {
    const result = await hugrecords.logAction(event.guild.id, event.member.id, tackling.id, Action.TACKLE_HUG)
    if (!result) {
        event.channel.send("Ahh, wasn't able to track that tackle.. ;-;")
        return
    }

    const theMessageData = generateMessage(event.member.displayName, tackling.displayName, HUG_STATE.WAITING, TIME_TO_DODGE / 1000)
    const message = await event.channel.send(theMessageData.toString())
    if (!(message instanceof Discord.Message)) return



    try {
        await message.react(A_EMOTE)
        await message.react(D_EMOTE)
    } catch (e) {
        console.log(e)
        return
    }

    const data = {
        tacklerId: event.author.id,
        tackledId: tackling.id,
        state: HUG_STATE.WAITING,
        begin: new Date().getTime(),
        solidified: 0,
        countdownIndex: theMessageData instanceof langAPI.TranslateResult ? theMessageData.usedIndex : 0,
        updating: false,
        doneUpdating: false,
        /**@type {number} */
        insertId: result.insertId,
        get timeLeft() {
            return Math.round((this.begin + TIME_TO_DODGE - new Date().getTime()) / 1000)
        },
        get shouldRemove() {
            return (new Date().getTime() - this.begin > MESSAGE_EXIST_FOR)
        },
        delete() {
            message.delete().catch(err => {
                // shrug
            })
        },
        async updateMessage() {
            if (this.doneUpdating) return
            if (this.timeLeft <= 0 && this.state == HUG_STATE.WAITING) this.state = HUG_STATE.TOO_LONG

            const newMessage = generateMessage(event.member.displayName, tackling.displayName, this.state,
                this.state == HUG_STATE.WAITING ? this.timeLeft : this.solidified, this.countdownIndex)
            if (message.content != newMessage.toString() && !this.updating) {
                this.updating = true
                try {
                    await message.edit(newMessage.toString())
                } catch (e) { }
                this.updating = false
            }
            if (this.state != HUG_STATE.WAITING) this.doneUpdating = true
        }
    }

    tacklehugs.push(data)
}

/**
 * 
 * @param {Discord.Message} event 
 * @param {Discord.GuildMember} tackling 
 */
async function beginTackleHug(event, tackling) {
    if (isCurrentlyTackling(event.author.id)) {
        const message = await event.channel.send(lang("already-tackling"))
        if (!(message instanceof Discord.Message)) return

        if (message.deletable) message.delete(1000 * 5)
        return
    }
    beginTackleHandling(event, tackling)
}