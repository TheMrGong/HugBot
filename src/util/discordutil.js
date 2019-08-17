//@ts-check

const Discord = require("discord.js")
const { AnimationContext } = require("./graphics/animatorutil")

const gifUtil = require("./graphics/gifutil")
const sharp = require("sharp")
const request = require("snekfetch")
const canvasAPI = require("canvas")
const { wrapImage } = require("./graphics/gifutil")

const EMOJI_GUILD = "457601288113487897"
const EMOJI_SIZE = 64

/**
 * 
 * @param {Discord.Message} message 
 * @param {number} skipTime - How many milliseconds until the message above can be considered the user's own
 * @returns {Promise<Discord.Message>}
 */
async function getMessageAbove(message, skipTime) {
    const messages = (await message.channel.fetchMessages({ limit: 10, before: message.id })).array().sort((a, b) => b.createdTimestamp - a.createdTimestamp)
    /**@type {Discord.Message} */

    let above;

    for (let k in messages) {
        /**@type {Discord.Message} */
        const pastMessage = messages[k]
        const millisecondsPassed = new Date().getTime() - pastMessage.createdTimestamp
        if (pastMessage.author.id == message.author.id && millisecondsPassed > skipTime) {
            break; // message is too far in the past
        }
        if (pastMessage.author.bot) continue
        if (pastMessage.author.id != message.author.id) {
            above = pastMessage
            break
        }
    }
    return above
}

/**
 * @param {string} id 
 */
function generateEmojiName(id) {
    const t = new Date().getTime().toString()
    return id + t.substring(t.length - 5, t.length)
}

/**
 * @param {Discord.User} user 
 * @returns {Promise<Discord.Emoji|string>}
 */
async function profileToEmoji(user) {
    const guild = user.client.guilds.get(EMOJI_GUILD)
    const emojiName = generateEmojiName(user.id)
    const url = user.displayAvatarURL
    const radius = EMOJI_SIZE / 2


    if (url.endsWith(".gif")) {
        const gif = await gifUtil.createURLImageDrawer(url, { width: EMOJI_SIZE })

        const animator = new AnimationContext(gif.gifInfo.fps, gif.gifInfo.duration, EMOJI_SIZE, EMOJI_SIZE, f => {
            f.ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
            f.ctx.clip()
            gif.draw(f, 0, 0, EMOJI_SIZE, EMOJI_SIZE)
        })
        animator.backgroundColor = "#36393f"
        const gifBuffer = await animator.generateGif()
        let emoji;
        try {
            emoji = await guild.createEmoji(gifBuffer, emojiName)
            setTimeout(() => guild.deleteEmoji(emoji), 10000)
        } catch (e) {
            emoji = ""
            console.log("Emoji was too large for user " + user.username)
        }
        return emoji
    } else {
        //@ts-ignore
        const profileImageBuffer = await sharp((await request.get(url)).body).resize(EMOJI_SIZE, EMOJI_SIZE).toBuffer()
        const canvas = canvasAPI.createCanvas(EMOJI_SIZE, EMOJI_SIZE)
        const ctx = canvas.getContext("2d")

        ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
        ctx.clip()
        ctx.drawImage(wrapImage(profileImageBuffer), 0, 0)

        //@ts-ignore
        const emoji = await guild.createEmoji(canvas.toBuffer(), emojiName)
        setTimeout(() => guild.deleteEmoji(emoji), 10000)
        return emoji
    }
}

/**
 * @param {Discord.Message} message 
 * @param {Array<string>} args 
 * @returns {Promise<Array<Discord.GuildMember>>}
 */
async function findAllMembersInEvent(message, args) {
    if (!message || !message.guild) return []
    const mentioned = message.mentions.users.first();

    if (mentioned) return [await message.guild.fetchMember(mentioned)]
    const targetting = args.join(" ");

    return new Promise(async (resolve, reject) => {
        const promise = message.guild.fetchMembers()
        promise.then(() => {
            resolve(findAllMembersInGuildMatching(message.guild, targetting))
        }).catch(it => { }) // timeout
        setTimeout(() => resolve([]), 1000 * 2)
    })
}

/**
 * @param {Discord.Message} message 
 * @param {Array<string>} args 
 * @returns {Promise<Discord.GuildMember|undefined>}
 */
async function findMemberInEvent(message, args) {
    const members = await findAllMembersInEvent(message, args)
    if (members.length > 0) return members[0]
}

/**
 * 
 * @param {Discord.Guild} guild 
 * @param {string} targetting 
 * @returns {Array<Discord.GuildMember|undefined>}
 */
function findAllMembersInGuildMatching(guild, targetting) {
    // find direct match
    let membersFound = findMembersBy(
        guild,
        targetting,
        member => member.displayName,
        CheckType.Equals
    );

    const checkOrder = [CheckType.StartsWith, CheckType.Equals, CheckType.Includes]
    /**@type {Array<function(Discord.GuildMember): string>} */
    const transformOrder = [(member) => member.displayName, (member) => member.user.username]

    for (let k in transformOrder) {
        const transform = transformOrder[k]
        if (membersFound.length == 0) {
            for (let i in checkOrder) {
                const check = checkOrder[i]
                if (membersFound.length == 0) {
                    membersFound = findMembersBy(guild, targetting, transform, check)
                } else break
            }
        } else break
    }

    return membersFound
}

/**
 * @callback Checker
 * @param {string} name
 * @param {string} finding
 * @returns {boolean}
 */
/**
 * @enum {Checker}
 */
const CheckType = {
    Includes: (name, finding) => name.includes(finding),
    Equals: (name, finding) => name == finding,
    StartsWith: (name, finding) => name.startsWith(finding)
}

/**
 * Converts a GuildMember into a string
 * @callback transform
 * @param {Discord.GuildMember} transforming
 * @returns {string}
 */


/**
 * 
 * @param {Discord.Guild} guild 
 * @param {string} finding 
 * @param {transform} transform - How to search for the user
 * @param {CheckType} type Checks the names directly
 * @returns {Array<Discord.GuildMember>}
 */
function findMembersBy(guild, finding, transform, type = CheckType.Includes) {
    finding = finding.toLowerCase()

    return guild.members.filter(v => type(transform(v).toLowerCase(), finding)).array()
}

module.exports = {
    getMessageAbove,
    profileToEmoji,
    findAllMembersInEvent,
    findMemberInEvent,
    findMembersBy,
    findAllMembersInGuildMatching
}