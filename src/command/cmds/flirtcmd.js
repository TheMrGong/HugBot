//@ts-check
const Discord = require("discord.js")
const Easing = require("easing-functions")
const { AnimationContext } = require("../../util/graphics/animatorutil")

const { findMemberInEvent } = require("../../util/discordutil")
const { createURLImageDrawer, wrapImage } = require("../../util/graphics/gifutil")
const { shuffle, readFile } = require('../../util/jsutils')

const lang = require("../../lang/lang.js").prefixed("cmd.flirt.")
const hugrecords = require("../../hug/records/hugrecords")
const { HugActions } = require("../../hug/action/hugaction")

const canvasAPI = require("canvas")

const domain = (finding) => "res/flirt/" + finding

const flirtBox = readFile(domain("flirt-box.png"))
const heartImage = readFile(domain("heart.png"))
const template = readFile(domain("template.png"))

const letterF = readFile(domain("/letters/F.png"))
const letterL = readFile(domain("letters/L.png"))
const letterI = readFile(domain("letters/I.png"))
const letterR = readFile(domain("letters/R.png"))
const letterT = readFile(domain("letters/T.png"))

const STEW_ID = "263675970270003200"

const BEGIN_FLIRT = "Preparing amazing flirt..."

const FLIRT_GENERATING_MESSAGES = [
    "Cobbling together cool images...",
    "Injecting love into images...",
    "Adding in affection...",
    "Adding extra love...",
    "Ensuring maximum affection...",
    "Researching smooth words...",
    "Powdering on some love...",
    "Adding a bit of genuineness...",
    "Making sure there's lots of love...",
    "Looking for the best ways to flirt...",
    "Getting cupid for assistance...",
    "Looking at `Flirting for Dummys..."
]

/**
 * @typedef {Object} FlirtData
 * @property {canvasAPI.Image} flirtBox
 * @property {canvasAPI.Image} heartImage
 * @property {canvasAPI.Image} template
 * @property {FlirtLetters} letters
 */

/**
 * @typedef {Object} FlirtLetters
 * @property {canvasAPI.Image} F
 * @property {canvasAPI.Image} L
 * @property {canvasAPI.Image} I
 * @property {canvasAPI.Image} R
 * @property {canvasAPI.Image} T
 */

/**
 * @returns {Promise<FlirtData>}
 */
async function getFlirtImages() {
    return {
        flirtBox: wrapImage(await flirtBox),
        heartImage: wrapImage(await heartImage),
        template: wrapImage(await template),
        letters: {
            F: wrapImage(await letterF),
            L: wrapImage(await letterL),
            I: wrapImage(await letterI),
            R: wrapImage(await letterR),
            T: wrapImage(await letterT),
        }
    }
}

const GifProperties = {
    FPS: 20,
    WIDTH: 1280,
    HEIGHT: 720,
    DURATION: 1000 * 3
}

/**
 * @typedef {Object} PositionData
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {boolean} crop
 */

/**
 * @typedef {Object} ProfilePostions
 * @property {PositionData} stew
 * @property {PositionData} regular
 */

/**@type {ProfilePostions} */
const ProfilePosition = {
    stew: {
        x: 729,
        y: 107,
        width: 408,
        height: 432,
        crop: false
    },
    regular: {
        x: 746,
        y: 120,
        width: 408,
        height: 408,
        crop: true
    }
}

/**
 * @typedef {Object} OffsetData
 * @property {number} offsetX
 * @property {number} offsetY
 */

/**
 * @param {number} x 
 * @param {number} y 
 * @returns {OffsetData}
 */
function offset(x, y) {
    return {
        offsetX: x,
        offsetY: y
    }
}

const FlirtBoxData = {
    x: 61,
    y: 262,
    Heart: {
        offsetX: 28,
        offsetY: 37,
        width: 105,
        height: 94
    },
    Letters: {
        F: offset(164, 29),
        L: offset(243, 33),
        I: offset(315, 28),
        R: offset(389, 56),
        T: offset(460, 32)
    }
}

/**
 * 
 * @param {string} url
 * @param {Discord.GuildMember} member
 * @param {function(string):void} statusUpdater
 * @returns {Promise<Discord.Attachment>}
 */
async function animateFlirt(url, member, statusUpdater) {

    const profileData = member.id == STEW_ID ? ProfilePosition.stew : ProfilePosition.regular
    const flirtData = await getFlirtImages()

    console.log("Fetching image [" + url + "]...")
    let imageDrawer;
    if (!statusUpdater) statusUpdater = (status) => { }

    statusUpdater("<a:updating:403035325242540032>Profile")

    imageDrawer = await createURLImageDrawer(url, {
        duration: GifProperties.DURATION,
        width: profileData.width,
        height: profileData.height
    })

    let duration = imageDrawer.gifInfo ? imageDrawer.gifInfo.duration : GifProperties.DURATION
    let fps = imageDrawer.gifInfo ? Math.floor(imageDrawer.gifInfo.fps) : GifProperties.FPS

    const animation = new AnimationContext(fps, duration, GifProperties.WIDTH, GifProperties.HEIGHT, async (f) => {

        f.ctx.drawImage(flirtData.template, 0, 0)

        f.ctx.save()
        {
            f.ctx.translate(profileData.x, profileData.y)
            if (profileData.crop) {
                const radius = profileData.width / 2
                f.ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
                f.ctx.clip()
            }
            await imageDrawer.draw(f, 0, 0, profileData.width, profileData.height)
        }
        f.ctx.restore()

        f.ctx.fillStyle = member.displayHexColor
        f.ctx.font = f.ctx.font = "60px Whitney-Book"
        const measurements = f.ctx.measureText(member.displayName)
        f.ctx.fillText(member.displayName, profileData.x + profileData.width / 2 - measurements.width / 2, profileData.y - 10)


        f.ctx.translate(FlirtBoxData.x, FlirtBoxData.y)
        f.ctx.drawImage(flirtData.flirtBox, 0, 0)

        f.ctx.save()
        {
            f.ctx.translate(FlirtBoxData.Heart.offsetX, FlirtBoxData.Heart.offsetY)
            f.ctx.translate(FlirtBoxData.Heart.width / 2, FlirtBoxData.Heart.height / 2)
            const pumps = 3 * 2

            const heartScale = f.lerp(1, 0.9, duration / ((pumps / GifProperties.DURATION) * duration), Easing.Quadratic.Out, "reset")
            f.ctx.scale(heartScale, heartScale)
            f.ctx.translate(-(FlirtBoxData.Heart.width / 2), -(FlirtBoxData.Heart.height / 2))

            f.ctx.drawImage(flirtData.heartImage, 0, 0, FlirtBoxData.Heart.width, FlirtBoxData.Heart.height)
        }
        f.ctx.restore()

        for (let letter in flirtData.letters) {
            /**@type {canvasAPI.Image} */
            const image = flirtData.letters[letter]
            /**@type {OffsetData} */
            const positionData = FlirtBoxData.Letters[letter]
            const initialOffset = Math.floor((Math.random() * 4) + 2);

            f.ctx.drawImage(image, positionData.offsetX, positionData.offsetY + initialOffset)
        }
    })
    return new Discord.Attachment(await animation.generateGif(status => {
        statusUpdater(status)
    }), "flirt.gif")
}

/**
 * @param {Discord.Message} message 
 * @param {Discord.GuildMember} flirtWith 
 */
async function doFlirting(message, flirtWith) {
    if (message.client.user.id == flirtWith.id) return message.channel.send(lang("bot"))
    if (message.author.id == flirtWith.id) return message.channel.send(lang("self"))

    if (message.deletable) message.delete()

    const messages = shuffle(FLIRT_GENERATING_MESSAGES.slice(0))
    const flirtWaiting = await message.channel.send("[<a:updating:403035325242540032>Profile] " + BEGIN_FLIRT)
    if (!(flirtWaiting instanceof Discord.Message)) return

    /**@property {Promise<Message>} */
    let waitingEdit;
    let index = 0
    let currentStatus = ""
    const statusUpdater = setInterval(function () {
        waitingEdit = flirtWaiting.edit("[" + currentStatus + "] " + messages[index++])
        if (index >= messages.length)
            index = 0
    }, 2000)
    let attachment;
    try {
        attachment = await animateFlirt(flirtWith.user.displayAvatarURL, flirtWith, status => {
            currentStatus = status
        })
    } catch (e) {
        throw e
    }
    clearInterval(statusUpdater)
    if (waitingEdit) await waitingEdit

    if (attachment) {
        await flirtWaiting.edit("[<a:loading:393852367751086090>Uploading...] Almost there...")
        await message.channel.send(attachment)
        flirtWaiting.delete()
        hugrecords.logAction(message.guild.id, message.author.id, flirtWith.id, HugActions.FLIRT)
    }
}

module.exports = {
    cmd: "flirt",
    /**
     * @param {Discord.Message} message
     * @param {Array<string>} args
     */
    async call(message, args) {

        let flirtingWith = await message.guild.fetchMember(message.client.user)

        if (message.guild.id == "457601288113487897") {
            flirtingWith = await message.client.guilds.get("110373943822540800").fetchMember("106429844627169280")
            //flirtingWith = await message.client.guilds.get("197002930396594177").fetchMember("192609410420310017") // xmc
        }

        if (args.length > 0) {
            flirtingWith = await findMemberInEvent(message, args)
            if (!flirtingWith) return message.channel.send(lang("fail"))
        }
        try {
            await doFlirting(message, flirtingWith)
        } catch (e) {
            console.log(e)
        }
    }
}