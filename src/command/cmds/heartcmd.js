//@ts-check
const Discord = require("discord.js")
const { AnimationContext, FrameInfo } = require("../../util/graphics/animatorutil")
const { maskImageWith } = require("../../util/graphics/canvasutils")
const { arrayToKeys } = require("../../util/jsutils")
const gifUtil = require("../../util/graphics/gifutil")
const sharp = require("sharp")
const canvasAPI = require("canvas")
const request = require("snekfetch")

const DISCORD_FONT = "19px Whitney-Medium"
const DISCORD_HEIGHT = 19 // higher than this causes discord to make gif look like gif and not text

const SPACE_MULTIPLIER = 1.3
const profileToEmoji = require("../../util/discordutil").profileToEmoji


class Renderable {
    /**
     * 
     * @param {number} width 
     * @param {number} height 
     */
    constructor(width, height) {
        this.width = width
        this.height = height
    }

    /**
     * 
     * @param {FrameInfo} f 
     * @param {*} x 
     * @param {*} y 
     */
    render(f, x, y) {
        throw "Not implemented"
    }
}

class TextRenderable extends Renderable {
    /**
     * 
     * @param {string} text 
     * @param {number} width 
     * @param {number} height 
     */
    constructor(text, width, height) {
        super(width, height)
        this.text = text
    }

    /**
     * 
     * @param {FrameInfo} f
     * @param {*} x 
     * @param {*} y 
     */
    render(f, x, y) {
        f.ctx.fillStyle = "#dcddde"
        f.ctx.fillText(this.text, x, y)
    }
}


const PADDING = 2

class ProfileRenderable extends Renderable {
    /**
     * 
     * @param {ProfileData} data
     * @param {number} width 
     * @param {number} height 
     */
    constructor(data, width, height) {
        super(width + PADDING, height)
        this.data = data
    }

    /**
     * 
     * @param {FrameInfo} f
     * @param {*} x 
     * @param {*} y 
     */
    render(f, x, y) {
        const measurements = f.ctx.measureText(this.data.displayName)
        f.ctx.translate(x + PADDING, 0)
        f.ctx.save()
        {
            f.ctx.translate(0, measurements.actualBoundingBoxAscent / 2 - DISCORD_HEIGHT / 2 + measurements.emHeightDescent)
            const radius = DISCORD_HEIGHT / 2
            f.ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
            f.ctx.clip()
            this.data.drawer.draw(f, 0, 0, DISCORD_HEIGHT, DISCORD_HEIGHT)
        }
        f.ctx.restore()
        f.ctx.translate(DISCORD_HEIGHT + f.ctx.measureText(" ").width * SPACE_MULTIPLIER, 0)

        let color = this.data.displayColor
        if (color == "#000000") color = "#dcddde"

        f.ctx.fillStyle = color
        f.ctx.fillText(this.data.displayName, 0, measurements.emHeightAscent)
    }
}

class ProfileData {
    /**
     * 
     * @param {gifUtil.ProfileImageDrawer} drawer
     * @param {string} displayName
     * @param {string} displayColor
     */
    constructor(drawer, displayName, displayColor) {
        this.drawer = drawer
        this.displayName = displayName
        this.displayColor = displayColor
    }
}

/**
 * @param {string} input 
 * @param  {...any} components 
 * @returns {Array<Renderable>}
 */
function parseToElements(input, ...components) {
    const canvas = canvasAPI.createCanvas(200, 200)
    const ctx = canvas.getContext("2d")
    const translate = arrayToKeys(...components)
    ctx.font = ctx.font = DISCORD_FONT
    const space = ctx.measureText(" ")

    /**@type {Array<Renderable>} */
    let elements = []

    console.log(translate)

    const texts = input.split(" ")
    for (let k in texts) {
        const last = parseInt(k) == texts.length - 1
        const text = texts[k]
        const m = ctx.measureText(text)

        const translated = translate[text.toLowerCase()]
        if (translated instanceof ProfileData) {
            const nameMeasurements = ctx.measureText(translated.displayName)
            elements.push(new ProfileRenderable(translated, DISCORD_HEIGHT + space.width * SPACE_MULTIPLIER + nameMeasurements.width, DISCORD_HEIGHT))
        } else elements.push(new TextRenderable(text, m.width, m.emHeightAscent))

        if (!last) elements.push(new TextRenderable(" ", space.width * SPACE_MULTIPLIER, space.emHeightAscent))
    }
    return elements
}

module.exports = {
    cmd: "heart",
    s: true,
    /**
     * @param {Discord.Message} message
     * @param {Array<string>} args
     */
    async call(message, args) {
        const emoji = await profileToEmoji(message.author)
        message.channel.send("Hello there " + emoji.toString() + " " + message.member.displayName)

        // const userAnimator = await gifUtil.createURLImageDrawer(message.author.displayAvatarURL)
        // const tackledAnimator = await gifUtil.createURLImageDrawer("https://cdn.discordapp.com/avatars/124633989955715072/f1c4ff7eb7acf88302a38a6dcd8c6e62.png?size=128")

        // //A leaping {tackler} comes outta nowhere, flying through the air towards {tackled}
        // const test = parseToElements("A leaping {tackler} comes outta nowhere, flying through the air towards {tackled}",
        //     "tackler", new ProfileData(userAnimator, message.member.displayName, message.member.displayHexColor),
        //     "tackled", new ProfileData(tackledAnimator, "WesJD", "#000000"))

        // let width = 0
        // test.forEach(r => width += r.width)

        // const animation = new AnimationContext(30, 1000 * 3, Math.ceil(width) + 20, DISCORD_HEIGHT + 3, async f => {
        //     f.ctx.font = f.ctx.font = DISCORD_FONT

        //     let curX = 10
        //     test.forEach(renderable => {
        //         f.ctx.save()
        //         {

        //             renderable.render(f, curX, renderable.height)
        //             curX = curX + renderable.width
        //         }
        //         f.ctx.restore()
        //     })

        // })
        // animation.backgroundColor = "#36393f"
        // const mask = await gifUtil.createURLImageDrawer("res/heart/mask.gif")

        // const animation = new AnimationContext(mask.gifInfo.fps, mask.gifInfo.duration, mask.gifInfo.width, mask.gifInfo.height, async f => {
        //     const maskImage = gifUtil.wrapImage(mask.getCurrentImage(f))
        //     const userImage = gifUtil.wrapImage(await sharp(userAnimator.getCurrentImage(f)).resize(maskImage.width, maskImage.height).toBuffer())

        //     const userX = 0//(mask.gifInfo.width / 2)// - userAnimator.gifInfo.width / 2
        //     const userY = 0//(mask.gifInfo.height / 2)// - userAnimator.gifInfo.height / 2
        //     const maskedUser = await maskImageWith(userImage, userX, userY, maskImage)
        //     f.ctx.drawImage(maskedUser, userX, userY)
        // })
        //message.channel.send(new Discord.Attachment(await animation.generateGif(), "test.gif"))
    }
}