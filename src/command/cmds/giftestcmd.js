//@ts-check
const Discord = require("discord.js")
const request = require('snekfetch');

const GIFEncoder = require('gifencoder');
const canvasAPI = require("canvas"),
    createCanvas = canvasAPI.createCanvas
const Easing = require("easing-functions")
//const gifFrames = require("gif-frames")
const upng = require("upng-js")
const fs = require("fs")
const { findMemberInEvent } = require("../util")

canvasAPI.registerFont("./res/Whitney.ttf", { family: "Whitney" })
//Whitney Medium.ttf
canvasAPI.registerFont("./res/Whitney Medium.ttf", { family: "Whitney-Medium" })
canvasAPI.registerFont("./res/Roboto-Regular.ttf", { family: "Roboto" })

async function doProcessing(data) {

    // cannot post buffer to worker?
    return new Promise((resolve, reject) => {
        console.log("Decoding...")
        const thing = upng.decode(data)
        const frames = upng.toRGBA8(thing)
        console.log("Done decoding.")
        resolve({
            width: thing.width,
            height: thing.height,
            frames,
            frameInfo: thing.frames
        })
    })
}

// //@ts-ignore
// const animeFrames = new Promise((resolve, reject) => {
//     fs.readFile("./res/speed.png", async (err, data) => {
//         if (err) reject(err)
//         else {
//             //@ts-nocheck
//             resolve(await doProcessing(data))
//         }
//     })
// })

// stream the results as they are available into myanimated.gif

const FPS = 20
const MS_PER_FRAME = Math.round(100 / FPS) * 10

const GIF_DURATION = 1.2 * 2 * 2 * 1000
const FRAMES = Math.ceil(GIF_DURATION / MS_PER_FRAME)

const WIDTH = 320
const HEIGHT = 240

const EASE = Easing.Quadratic.InOut

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @param {number} begin 
 * @param {number} end 
 * @param {number} time 
 * @returns {number}
 */
function lerp(begin, end, time) {
    return begin * (1 - time) + end * time
}

/**
 * @param {Point} begin 
 * @param {Point} end 
 * @param {number} time 
 * @returns {Point}
 */
function lerpP(begin, end, time) {
    return {
        x: lerp(begin.x, end.x, time),
        y: lerp(begin.y, end.y, time)
    }
}

function convertFrameWithMasking(arrayBuffer, width, height) {
    const canvas = canvasAPI.createCanvas(width, height)
    const context = canvas.getContext("2d")
    const imageData = canvasAPI.createImageData(new Uint8ClampedArray(arrayBuffer.slice(0)), width, height)

    context.putImageData(imageData, 0, 0)
    const getColorIndicesForCoord = (x, y, width) => {
        const red = y * (width * 4) + x * 4;
        return [red, red + 1, red + 2, red + 3];
    };

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const [redIndex, greenIndex, blueIndex, alphaIndex] = getColorIndicesForCoord(x, y, canvas.width);
            imageData.data[alphaIndex] = Math.floor((imageData.data[redIndex] + imageData.data[greenIndex] + imageData.data[blueIndex]) / 3)
            imageData.data[redIndex] = 255 - imageData.data[redIndex]
            imageData.data[greenIndex] = 255 - imageData.data[greenIndex]
            imageData.data[blueIndex] = 255 - imageData.data[blueIndex]
        }
    }
    context.putImageData(imageData, 0, 0)

    const image = new canvasAPI.Image()
    image.src = canvas.toBuffer()
    return image
}

function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === "undefined") {
        radius = 5;
    }
    if (typeof radius === "number") {
        radius = {
            tl: radius,
            tr: radius,
            br: radius,
            bl: radius
        };
    } else {
        var defaultRadius = {
            tl: 0,
            tr: 0,
            br: 0,
            bl: 0
        };
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
}

function loopTime(time) {
    const number = Math.floor(time)
    const positive = number % 2 == 0
    return !positive ? 1 - (time - number) : (time - number)
}

function getAnimationProgress(currentTime, beginTime, animationDuration, loop = true) {
    const endTime = beginTime + animationDuration
    const ret = 1 - ((endTime - currentTime) / animationDuration)
    if (!loop) return ret
    else return loopTime(ret)
}

/**
 * @param {Buffer} imageBuffer
 * @param {string} name
 * @param {string} color - In hex
 * @returns {Promise<Discord.Attachment>}
 */
async function createAnimation(imageBuffer, name, color, progressCallback) {
    if (color == "#000000") color = "#ffffff"

    const encoder = new GIFEncoder(WIDTH, HEIGHT);
    const beginTime = new Date().getTime()

    const ctx = createCanvas(WIDTH, HEIGHT).getContext('2d');

    const animationDuration = 1000 * 1.2
    const quality = 8


    encoder.start();
    encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
    encoder.setDelay(MS_PER_FRAME)  // frame delay in ms
    encoder.setQuality(quality); // image quality. 10 is default.

    console.log("Total frames: " + FRAMES + " hex: " + color)
    const userProfileImage = new canvasAPI.Image()
    userProfileImage.src = imageBuffer

    const rectWidth = 90
    const rectHeight = 90
    const from = {
        x: (WIDTH / 2) - (rectWidth / 2),
        y: (HEIGHT / 2) - (rectHeight / 2) + 20
    }
    const to = {
        x: from.x,
        y: from.y + 20
    }

    // try {
    //     await animeFrames
    // } catch (e) {
    //     console.log(e)
    //     return
    // }
    // const animeGif = await animeFrames

    // let animeDelay = 0
    // let animeFrame = 0

    // let lastAnimeUpdate = beginTime

    // let animeImage = convertFrameWithMasking(animeGif.frames[0], animeGif.width, animeGif.height)

    console.log("FRAMES: " + FRAMES)
    for (let i = 0; i <= FRAMES; i++) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        const currentTime = beginTime + (i * encoder.delay * 10)

        // /**@type {Buffer} */
        // if (currentTime - lastAnimeUpdate >= animeGif.frameInfo[animeFrame].delay) {
        //     lastAnimeUpdate = currentTime
        //     animeFrame++
        //     if (animeFrame > animeGif.length) animeFrame = 0
        //     animeImage = convertFrameWithMasking(animeGif.frames[animeFrame], animeGif.width, animeGif.height)
        // }

        ctx.save()
        ctx.shadowColor = "rgba(0, 0, 0, 0.13)"
        ctx.shadowBlur = 5

        ctx.shadowOffsetX = 5
        ctx.shadowOffsetY = 5


        let time = getAnimationProgress(currentTime, beginTime, animationDuration)

        const interpolated = lerpP(from, to, EASE(time))

        ctx.restore()
        // reset
        ctx.fillStyle = "#2f3136"
        ctx.fillRect(0, 0, WIDTH, HEIGHT)

        ctx.save()
        const profileRescale = lerp(1, 1.02, EASE(getAnimationProgress(currentTime, beginTime, 1000 * 1.2 / 4)))

        const padding = 15

        // bs that has to be done to have consistent font width measurements
        ctx.font = ctx.font = "18px Whitney-Medium"
        const whitney = ctx.font


        const nameMeasures = ctx.measureText(name)
        const nameOffset = 2

        const topExtra = nameMeasures.width <= rectWidth ? nameMeasures.actualBoundingBoxAscent + nameOffset + padding : 0

        const boxBeginX = interpolated.x - padding / 2
        const boxBeginY = interpolated.y - padding / 2 - topExtra
        const boxCurveWidth = (rectWidth + padding)
        const boxCurveHeight = rectHeight + padding + topExtra
        ctx.translate(boxBeginX + (boxCurveWidth / 2), boxBeginY + (boxCurveHeight / 2))
        ctx.scale(profileRescale, profileRescale)
        const params = [-(boxCurveWidth / 2), -(boxCurveHeight / 2), boxCurveWidth, boxCurveHeight]
        roundRect(ctx, ...params, 20)
        ctx.clip()
        ctx.fillStyle = "#36393f"
        //@ts-ignore
        ctx.fillRect(...params)

        ctx.restore()


        ctx.save()

        ctx.font = ctx.font = "20px Roboto"
        const roboto = ctx.font
        ctx.translate(interpolated.x + rectWidth / 2, interpolated.y + rectHeight / 2)
        ctx.scale(profileRescale, profileRescale)

        function doPath() {
            ctx.beginPath();
            const radius = rectWidth / 2
            const extra = 0
            ctx.arc(radius - (rectWidth / 2), radius - (rectWidth / 2), radius + extra, 0, 2 * Math.PI);
        }
        doPath()
        ctx.clip()
        ctx.drawImage(userProfileImage, -(rectWidth / 2), -(rectHeight / 2), rectWidth, rectHeight)


        ctx.restore()
        ctx.save()

        ctx.fillStyle = color
        ctx.font = whitney

        const textX = interpolated.x + rectWidth / 2 - nameMeasures.actualBoundingBoxRight / 2
        const textY = interpolated.y - nameMeasures.actualBoundingBoxAscent - nameOffset
        const widthAdjust = nameMeasures.actualBoundingBoxRight / 2
        const heightAdjust = nameMeasures.actualBoundingBoxAscent / 2
        ctx.translate(textX + widthAdjust, textY + heightAdjust)
        ctx.scale(profileRescale, profileRescale)
        ctx.fillText(name, -widthAdjust, -heightAdjust)
        ctx.restore()

        ctx.font = roboto
        ctx.fillStyle = "#ffffff"
        ctx.save()

        function drawCentered(x, y, text) {
            const width = ctx.measureText(text).width

            ctx.fillText(text, x - (width / 2), y)
        }
        drawCentered(WIDTH / 2, HEIGHT / 10, "GIF at " + ((currentTime - beginTime) / 1000).toFixed(2) + "s out of " + (GIF_DURATION / 1000).toFixed(2) + "s")
        drawCentered(WIDTH / 2, HEIGHT / 10 + 20, "Animation at " + time.toFixed(2))

        const progressInterp = 1 - ((beginTime + GIF_DURATION) - currentTime) / GIF_DURATION

        const boxWidth = lerp(0, WIDTH, Easing.Quadratic.In(progressInterp))
        const boxHeight = 30
        ctx.restore()
        ctx.save()
        ctx.fillStyle = "rgba(92, 236, 9, 1)"

        //ctx.fillRect(0, HEIGHT - boxHeight, boxWidth, boxHeight)
        ctx.restore()
        ctx.fillStyle = "#ffffff"
        ctx.font = ctx.font = "10px Roboto"
        const rescale = lerp(1, 1.1, EASE(getAnimationProgress(currentTime, beginTime, 1000 * 1.2)))

        ctx.save()

        const upOffset = lerp(-3, 3, EASE(getAnimationProgress(currentTime, beginTime, 1000 * 1.2 / 2)))

        const qualityText = "Quality compression: " + quality
        const theLength = ctx.measureText(qualityText)
        ctx.translate(WIDTH - theLength.width / 2 - 6, HEIGHT - 10 - upOffset)
        ctx.scale(rescale, rescale)

        const swayProgress = EASE(getAnimationProgress(currentTime, beginTime, 1000 * 1.2 * 2))

        ctx.rotate(lerp(-3, 3, swayProgress) * Math.PI / 180)
        ctx.fillText(qualityText, -(theLength.width / 2), 0)
        ctx.restore()
        ctx.save()
        const fpsText = "FPS: " + FPS
        const fpsLength = ctx.measureText(fpsText)


        ctx.translate(WIDTH - fpsLength.width / 2 - 6, HEIGHT - 3 - theLength.actualBoundingBoxAscent - 10 - upOffset)
        ctx.scale(rescale, rescale)

        ctx.rotate(lerp(-5, 5, loopTime(swayProgress + 0.3)) * Math.PI / 180)
        ctx.fillText(fpsText, -(fpsLength.width / 2), 0)
        ctx.fillStyle = "#ff0000"
        // do recording circle

        const circleProgress = getAnimationProgress(currentTime, beginTime, 1000 * 1.2 / 2)
        if (circleProgress >= 0.5) {
            ctx.beginPath();
            ctx.arc(-(fpsLength.width / 2) - 5, -(fpsLength.actualBoundingBoxAscent / 2), 3, 0, 2 * Math.PI, false);
            ctx.fill();
        }

        ctx.restore()


        if (progressCallback) await progressCallback(progressInterp)
        //ctx.drawImage(animeImage, 0, 0, WIDTH, HEIGHT)

        encoder.addFrame(ctx)
    }
    return new Promise(resolve => {
        let buffers = [];
        let stream = encoder.createReadStream();


        stream.on("data", buffer => {
            buffers.push(buffer)
        })
        stream.on("end", () => {
            const endBuffer = Buffer.concat(buffers)
            console.log("Did things")
            resolve(new Discord.Attachment(endBuffer, "test.gif"))
        })
        encoder.finish()
    })
}

module.exports = {
    cmd: "giftest",
    /**
     * @param {Discord.Message} message
     * @param {Array<string>} args
     */
    async call(message, args) {
        console.log("Starting typing")
        let usingMember = message.member
        if (args.length > 0) {
            const member = await findMemberInEvent(message, args)
            if (member) usingMember = member
        }
        const th = await request.get(usingMember.user.displayAvatarURL)

        if (message.deletable) message.delete()

        if (th.body instanceof Buffer) {
            let lastChange = 0
            const newMessage = await message.channel.send("Generating...")
            message.channel.startTyping()
            message.channel.send("HUGS", await createAnimation(th.body, usingMember.displayName, usingMember.displayHexColor, async progress => {
                const timeSinceProgress = new Date().getTime() - lastChange
                if (timeSinceProgress >= 2000 || progress >= 1) {
                    message.channel.startTyping()
                    console.log("Progress: " + (progress * 100).toFixed(1) + "%")
                    lastChange = new Date().getTime()
                    if (newMessage instanceof Discord.Message) {
                        const totalBars = 10
                        const bars = "|".repeat(totalBars * progress).replace(/\|\|/g, "\\||")
                        const spaces = " ".repeat(totalBars - totalBars * progress)
                        await newMessage.edit("Generating at " + (progress * 100).toFixed(1) + "% [" + bars + spaces + "]")
                        if (progress >= 1) await newMessage.delete(1000 * 1.5)
                    }
                }
            }))
        }
        else console.log("wtf")
        message.channel.stopTyping(true)
    }

}