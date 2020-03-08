//@ts-check
const Discord = require("discord.js")
const { AnimationContext } = require("../../util/graphics/animatorutil")

const { wrapImage, createURLImageDrawer } = require("../../util/graphics/gifutil")
const { drawRoundRectangle } = require("../../util/graphics/canvasutils")
const { readFile } = require("../../util/jsutils")


// image size - 50
// pos - 22, 15

// kanji top - 250 17
// kanji middle - 266 134
// kanji bottom - 241. 154
const RES_PATH = "res/gnomepoint/"

const ProfileData = {
    width: 50,
    height: 50,
    x: 32,
    y: 10
}

const GifProperties = {
    FPS: 30,
    WIDTH: 433,
    HEIGHT: 338,
    DURATION: 1000 * 3
}

const gnomeDataLoadable = async () => {
    return {
        background: wrapImage(await readFile(RES_PATH + "template.png")),
        kanji: {
            top: {
                image: wrapImage(await readFile(RES_PATH + "kanji top.png")),
                x: 259,
                y: 0,
                width: 101,
                height: 113,
                offset: 0.95
            },
            middle: {
                image: wrapImage(await readFile(RES_PATH + "kanji middle.png")),
                x: 266,
                y: 134,
                width: 138,
                height: 18,
                offset: 0.75
            },
            bottom: {
                image: wrapImage(await readFile(RES_PATH + "kanji bottom.png")),
                x: 241,
                y: 154,
                width: 121,
                height: 109,
                offset: 0.1
            }
        }
    }
}

/**
 * @param {string} profileUrl 
 * @param {Discord.GuildMember} member 
 */
async function animateGnomePoint(profileUrl, member) {
    const imageDrawer = await createURLImageDrawer(profileUrl, {
        duration: GifProperties.DURATION,
        width: ProfileData.width,
        height: ProfileData.height
    })

    const gnomeData = await gnomeDataLoadable()

    const animation = new AnimationContext(GifProperties.FPS, GifProperties.DURATION, GifProperties.WIDTH, GifProperties.HEIGHT, async (f) => {
        f.ctx.drawImage(gnomeData.background, 0, 0)

        f.ctx.font = f.ctx.font = "25x Whitney-Medium"
        const measurements = f.ctx.measureText(member.displayName)
        const offsetXText = 3
        {
            const margin = 5
            f.ctx.fillStyle = "#ffffff"
            f.ctx.save()
            drawRoundRectangle(f.ctx, ProfileData.x - margin, ProfileData.y - margin, ProfileData.width + offsetXText + measurements.width + margin * 2, ProfileData.height + margin * 2, 20)
            f.ctx.restore()
        }
        f.ctx.save()
        {
            f.ctx.translate(ProfileData.x, ProfileData.y)
            const radius = ProfileData.width / 2
            f.ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
            f.ctx.clip()
            await imageDrawer.draw(f, 0, 0, ProfileData.width, ProfileData.height)
        }
        f.ctx.restore()

        f.ctx.fillStyle = member.displayHexColor
        f.ctx.font = f.ctx.font = "25x Whitney-Medium"
        f.ctx.fillText(member.displayName, ProfileData.x + ProfileData.width + offsetXText, ProfileData.y + ProfileData.height / 2 + (measurements.actualBoundingBoxAscent / 2))

        const kanji = gnomeData.kanji
        for (let k in kanji) {
            const data = kanji[k]

            f.ctx.save()
            {
                f.ctx.translate(data.x, data.y)
                f.ctx.translate(data.width / 2, data.height / 2)
                const scale = f.lerp(0.98, 1.01, GifProperties.DURATION / 8, t => {
                    t = t + data.offset
                    return t * t
                })
                f.ctx.scale(scale, scale)
                f.ctx.translate(-(data.width / 2), -(data.height / 2))

                f.ctx.drawImage(data.image, 0, 0, data.width, data.height)
            }
            f.ctx.restore()
        }
    })
    return new Discord.Attachment(await animation.generateGif(), "gnomepoint.gif")
}

module.exports = {
    cmd: "gnomepoint",
    s: true,
    /**
     * @param {Discord.Message} message
     * @param {Array<string>} args
     */
    async call(message, args) {
        if (message.deletable) message.delete()
        const member = await message.guild.fetchMember(message.author)
        const progress = await message.channel.send("<a:loading:393852367751086090> Doing some gnome stuff...")
        await message.channel.send(await animateGnomePoint(member.user.displayAvatarURL, member))

        //@ts-ignore
        progress.delete()
    }
}