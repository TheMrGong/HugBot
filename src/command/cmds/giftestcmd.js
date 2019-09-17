//@ts-check
const Discord = require("discord.js")
const { AnimationContext } = require("../../util/graphics/animatorutil")

const request = require('snekfetch');
const fs = require("fs")

const gifFrames = require("gif-frames")
const canvasAPI = require("canvas")
const sharp = require('sharp');

const { findMemberInEvent } = require("../../util/discordutil")
const { readImage } = require("../../util/graphics/gifutil")

async function loadKeyFrames(path) {
    return new Promise((resolve, reject) => {
        fs.readFile("res/" + path, (err, data) => {
            if (err) return reject(err)
            resolve({
                data: JSON.parse(data.toString()).motion,
                getFrame(frame) {
                    if (frame < 0) frame = 0
                    else if (frame >= this.data.length) frame = this.data.length - 1
                    return this.data[frame]
                }
            })
        })
    })
}

/**
 * @param {Buffer} huggingBuffer
 * @param {Buffer} dodgingBuffer
 * @returns {Promise<Discord.Attachment>}
 */
async function createHugDodge(huggingBuffer, dodgingBuffer) {
    //@ts-ignore
    const frameData = await gifFrames({ url: "res/hugdodge/dodge.gif", outputType: "png", frames: "all", cumulative: true })
    const dodgingTracking = await loadKeyFrames("hugdodge/dodgerMotion.json")
    const dodgingOpacity = await loadKeyFrames("hugdodge/dodgerOpacity.json")
    const huggingTracking = await loadKeyFrames("hugdodge/huggingMotion.json")
    const huggingOpacity = await loadKeyFrames("hugdodge/huggingOpacity.json")

    let lengthInMillis = 0
    frameData.forEach(frame => {
        lengthInMillis += frame.frameInfo.delay * 10
    })
    const firstFrame = frameData[0].frameInfo

    const huggingPicture = new canvasAPI.Image()
    huggingPicture.src = await sharp(huggingBuffer).flop().toBuffer()

    const dodgingPicture = new canvasAPI.Image()
    dodgingPicture.src = dodgingBuffer

    let lastIndex = 0
    const animation = new AnimationContext((frameData.length / (lengthInMillis / 1000)), lengthInMillis, firstFrame.width, firstFrame.height, async (f) => {
        const delay = frameData[lastIndex].frameInfo.delay * 10
        const gifIndex = Math.floor(f.currentTime / delay)
        lastIndex = gifIndex

        const currentFrame = frameData[gifIndex]
        const gifFrame = new canvasAPI.Image()
        gifFrame.src = await readImage(currentFrame.getImage())
        const picSize = 20
        const picRadius = picSize / 2

        f.ctx.drawImage(gifFrame, 0, 0)
        const hugging = huggingTracking.getFrame(gifIndex)

        f.ctx.save()
        {
            f.ctx.translate(hugging.x, hugging.y + 10)
            f.ctx.translate(-(picSize / 2), -(picSize / 2))

            f.ctx.beginPath();

            f.ctx.arc(picRadius, picRadius, picRadius, 0, 2 * Math.PI);
            f.ctx.save()
            {
                f.ctx.clip()
                const huggingOpacityFrame = huggingOpacity.getFrame(gifIndex)
                if (huggingOpacityFrame.opacity > 0)
                    f.ctx.drawImage(huggingPicture, 0, 0, picSize, picSize)
            }
            f.ctx.restore()
        }
        f.ctx.restore()

        f.ctx.save()
        {
            const dodging = dodgingTracking.getFrame(gifIndex)
            f.ctx.translate(dodging.x - 4, dodging.y + 4)

            f.ctx.translate(-(picSize / 2), -(picSize / 2))

            f.ctx.arc(picRadius, picRadius, picRadius, 0, 2 * Math.PI);
            f.ctx.clip()
            const dodgingOpacityFrame = dodgingOpacity.getFrame(gifIndex)
            if (dodgingOpacityFrame.opacity > 0)
                f.ctx.drawImage(dodgingPicture, 0, 0, picSize, picSize)
        }
        f.ctx.restore()
    })
    return new Discord.Attachment(await animation.generateGif(), "hugdodge.gif")
}

/**
 * @param {Buffer} tacklingBuffer
 * @param {Buffer} tackledBuffer
 * @returns {Promise<Discord.Attachment>}
 */
async function createTackleAccept(tacklingBuffer, tackledBuffer) {
    //@ts-ignore
    const frameData = await gifFrames({ url: "res/tackleaccept/tacklehugaccept.gif", outputType: "png", frames: "all", cumulative: true })
    const tackledTracking = await loadKeyFrames("tackleaccept/tackledMotion.json")
    const tacklerTracking = await loadKeyFrames("tackleaccept/tacklingMotion.json")
    const tackledRotation = await loadKeyFrames("tackleaccept/tackledRotation.json")

    let lengthInMillis = 0
    frameData.forEach(frame => {
        lengthInMillis += frame.frameInfo.delay * 10
    })
    const firstFrame = frameData[0].frameInfo

    const tacklingPicture = new canvasAPI.Image()
    tacklingPicture.src = await sharp(tacklingBuffer).flop().toBuffer()

    const tackledPicture = new canvasAPI.Image()
    tackledPicture.src = tackledBuffer

    let lastIndex = 0
    const animation = new AnimationContext((frameData.length / (lengthInMillis / 1000)), lengthInMillis, firstFrame.width, firstFrame.height, async (f) => {

        const delay = frameData[lastIndex].frameInfo.delay * 10
        const gifIndex = Math.floor(f.currentTime / delay)
        lastIndex = gifIndex

        const currentFrame = frameData[gifIndex]
        const gifFrame = new canvasAPI.Image()
        gifFrame.src = await readImage(currentFrame.getImage())
        const picSize = 64
        const picRadius = picSize / 2

        f.ctx.drawImage(gifFrame, 0, 0)
        const tackler = tacklerTracking.getFrame(gifIndex)

        f.ctx.save()
        f.ctx.translate(tackler.x, tackler.y)
        f.ctx.translate(-(picSize / 2), -(picSize / 2))

        f.ctx.beginPath();

        f.ctx.arc(picRadius, picRadius, picRadius, 0, 2 * Math.PI);
        f.ctx.save()
        f.ctx.clip()
        f.ctx.drawImage(tacklingPicture, 0, 0, picSize, picSize)
        f.ctx.restore()

        f.ctx.restore()

        f.ctx.save()
        const tackling = tackledTracking.getFrame(gifIndex)
        f.ctx.translate(tackling.x, tackling.y)
        f.ctx.translate(-20, 20)
        const tackledRotationFrame = tackledRotation.getFrame(gifIndex)

        f.ctx.rotate(tackledRotationFrame.degrees * Math.PI / 180)
        f.ctx.translate(-(picSize / 2), -(picSize / 2))

        f.ctx.arc(picRadius, picRadius, picRadius, 0, 2 * Math.PI);
        f.ctx.clip()
        if (gifIndex > 1)
            f.ctx.drawImage(tackledPicture, 0, 0, picSize, picSize)
        f.ctx.restore()
    })
    return new Discord.Attachment(await animation.generateGif(), "tackleaccept.gif")
}

/**
 * 
 * @param {Buffer} profileBuffer
 * @param {Buffer} tacklingBuffer
 * @returns {Promise<Discord.Attachment>}
 */
async function createTackleDodge(profileBuffer, tacklingBuffer) {
    //@ts-ignore
    const frameData = await gifFrames({ url: "res/tackledodge/dodge.gif", outputType: "png", frames: "all", cumulative: true })
    const tackledTracking = await loadKeyFrames("tackledodge/tackledMotion.json")
    const tacklerTracking = await loadKeyFrames("tackledodge/tacklingMotion.json")
    const tacklerScale = await loadKeyFrames("tackledodge/tacklingScale.json")

    let lengthInMillis = 0
    frameData.forEach(frame => {
        lengthInMillis += frame.frameInfo.delay * 10
    })
    const firstFrame = frameData[0].frameInfo

    const tacklingPicture = new canvasAPI.Image()
    tacklingPicture.src = profileBuffer

    const tackledPicture = new canvasAPI.Image()
    tackledPicture.src = tacklingBuffer

    let begunRunPast = false
    let lastIndex = 0
    const animation = new AnimationContext(frameData.length / (lengthInMillis / 1000), lengthInMillis, firstFrame.width, firstFrame.height, async (f) => {
        const delay = frameData[lastIndex].frameInfo.delay * 10
        const gifIndex = Math.floor(f.currentTime / delay)
        lastIndex = gifIndex

        const currentFrame = frameData[gifIndex]
        const gifFrame = new canvasAPI.Image()
        gifFrame.src = await readImage(currentFrame.getImage())
        const picSize = 90
        const picRadius = picSize / 2

        f.ctx.drawImage(gifFrame, 0, 0)
        const tackler = tacklerTracking.getFrame(gifIndex)

        f.ctx.save()
        const tacklerScaleFrame = tacklerScale.getFrame(gifIndex)
        if (tacklerScaleFrame.x > 100) begunRunPast = true
        f.ctx.translate(tackler.x - picSize / 2, tackler.y - picSize / 2 - (!begunRunPast ? 50 : 20))
        f.ctx.translate(picSize / 2, picSize / 2)
        if (!begunRunPast) f.ctx.translate(10, 0)

        if (!begunRunPast) {
            f.ctx.scale(0.3, 0.3)
        } else {
            f.ctx.scale(tacklerScaleFrame.x / 100, tacklerScaleFrame.y / 100)
        }
        f.ctx.translate(-(picSize / 2), -(picSize / 2))

        f.ctx.beginPath();

        f.ctx.arc(picRadius, picRadius, picRadius, 0, 2 * Math.PI);
        f.ctx.clip()
        f.ctx.drawImage(tacklingPicture, 0, 0, picSize, picSize)

        f.ctx.restore()

        const tackling = tackledTracking.getFrame(gifIndex)
        f.ctx.save()
        f.ctx.arc(tackling.x + picRadius - picSize / 2, tackling.y + picRadius - picSize / 2 - 20, picRadius, 0, 2 * Math.PI);
        f.ctx.clip()
        f.ctx.drawImage(tackledPicture, tackling.x - picSize / 2, tackling.y - picSize / 2 - 20, picSize, picSize)

        f.ctx.restore()
    })
    return new Discord.Attachment(await animation.generateGif(), "tackledodge.gif")
}


/**
 * 
 * @param {Buffer} tackledBuffer
 * @param {Buffer} tacklingBuffer
 * @returns {Promise<Discord.Attachment>}
 */
async function createTackleHugTooLong(tackledBuffer, tacklingBuffer) {
    //@ts-ignore
    const frameData = await gifFrames({ url: "res/tacklesuprise/rwby-tackle.gif", outputType: "png", frames: "all", cumulative: true })
    const tackledTracking = {
        data: JSON.parse(fs.readFileSync("res/tacklesuprise/tackledTracking.json").toString()).motion,
        getFrame(frame) {
            if (frame < 0) frame = 0
            else if (frame >= this.data.length) frame = this.data.length - 1
            return this.data[frame]
        }
    }
    const tacklerTracking = {
        data: JSON.parse(fs.readFileSync("res/tacklesuprise/tacklerTracking.json").toString()).motion,
        getFrame(frame) {
            if (frame < 0) frame = 0
            else if (frame >= this.data.length) frame = this.data.length - 1
            return this.data[frame]
        }
    }
    let lengthInMillis = 0
    frameData.forEach(frame => {
        lengthInMillis += frame.frameInfo.delay * 10
    })
    const firstFrame = frameData[0].frameInfo

    const tacklingPicture = new canvasAPI.Image()
    tacklingPicture.src = tackledBuffer

    const tackledPicture = new canvasAPI.Image()
    tackledPicture.src = tacklingBuffer

    let lastIndex = 0
    const animation = new AnimationContext(14.285, lengthInMillis, firstFrame.width, firstFrame.height, async (f) => {
        const delay = frameData[lastIndex].frameInfo.delay * 10
        const gifIndex = Math.floor(f.currentTime / delay)
        lastIndex = gifIndex
        const currentFrame = frameData[gifIndex]
        const gifFrame = new canvasAPI.Image()
        gifFrame.src = await readImage(currentFrame.getImage())
        const picSize = 64
        const picRadius = picSize / 2

        f.ctx.drawImage(gifFrame, 0, 0)
        const trackler = tacklerTracking.getFrame(gifIndex)

        f.ctx.beginPath();

        f.ctx.save()
        f.ctx.arc(trackler.x + picRadius - picSize / 2, trackler.y + picRadius - picSize / 2, picRadius, 0, 2 * Math.PI);
        f.ctx.clip()
        f.ctx.drawImage(tacklingPicture, trackler.x - picSize / 2, trackler.y - picSize / 2, picSize, picSize)

        f.ctx.restore()

        const tackling = tackledTracking.getFrame(gifIndex)
        f.ctx.arc(tackling.x + picRadius - picSize / 2, tackling.y + picRadius - picSize / 2, picRadius, 0, 2 * Math.PI);
        f.ctx.clip()
        f.ctx.drawImage(tackledPicture, tackling.x - picSize / 2, tackling.y - picSize / 2, picSize, picSize)
    })
    return new Discord.Attachment(await animation.generateGif(), "tackletoolong.gif")
}

module.exports = {
    cmd: "giftest",
    /**
     * @param {Discord.Message} message
     * @param {Array<string>} args
     */
    async call(message, args) {
        /** @type {Discord.Permissions}*/
        //@ts-ignore
        const perms = message.channel.memberPermissions(await message.guild.fetchMember(message.client.user))
        if (message.channel instanceof Discord.TextChannel && !perms.has("SEND_MESSAGES")) {
            console.log("CANT SEND!!")
            return
        }
        const pazia = message.guild.id == "264714814172037120"
        const flameyUser = await message.client.fetchUser(pazia ? "166335747501195264" : "253987768999346178")
        const flameyProfilePicture = await request.get(flameyUser.displayAvatarURL)

        let usingMember = await message.guild.fetchMember(message.author)
        if (args.length > 0) {
            const member = await findMemberInEvent(message, args)
            if (member) usingMember = member
            else {
                return message.channel.send("Couldn't find anyone called that..")
            }
        }
        console.log("Getting user display...")
        const th = await request.get(usingMember.user.displayAvatarURL)

        const canDelete = perms.has("MANAGE_MESSAGES")
        if (canDelete) message.delete()

        if (th.body instanceof Buffer && flameyProfilePicture.body instanceof Buffer) {
            const newMessage = await message.channel.send("Generating...")
            console.log("Starting typing")
            message.channel.startTyping(20)
            const begin = new Date().getTime()
            const attachement = await createHugDodge(th.body, flameyProfilePicture.body)
            if (newMessage instanceof Discord.Message) await newMessage.edit("Uploading...")
            await message.channel.send("HUGS GENERATED IN " + ((new Date().getTime() - begin) / 1000) + " second(s)!", attachement)
            if (newMessage instanceof Discord.Message && newMessage.deletable) newMessage.delete()
        }
        else console.log("wtf")
        message.channel.stopTyping(true)
    }

}