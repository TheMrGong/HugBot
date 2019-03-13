//@ts-check
const Discord = require("discord.js")
const request = require('snekfetch');

const GIFEncoder = require('gifencoder');
const canvas = require("canvas"),
    createCanvas = canvas.createCanvas
const Easing = require("easing-functions")
//const gifFrames = require("gif-frames")
const upng = require("upng-js")
const fs = require("fs")
const Worker = require('webworker-threads').Worker;

async function doProcessing(data) {

    // cannot post buffer to worker?
    return new Promise((resolve, reject) => {
        console.log("Creating working")
        const worker = new Worker(function() {
            console.log("Inw orker, setting")
            // this.onmessage = function(get) {
            //     console.log("Decoding...")
            //     //const thing = upng.decode(data)
            //     //const frames = upng.toRGBA8(thing)
            //     //console.log("Done decoding.")
            //     //postMessage({
            //     //    width: thing.width,
            //     //    height: thing.height,
            //     //    frames
            //     //})
            // }
            console.log("Set on message?")
        })

        console.log("Uhhh..")
        console.log("Posting message")
        console.log(data)
        worker.postMessage({
            e: "efsef"
        })
        // worker.onmessage = function(get) {
        //     console.log("woah")
        // }
    })
}

//@ts-ignore
const animeFrames = new Promise((resolve, reject) => {
    fs.readFile("./res/speed.png", async (err, data) => {
        if (err) reject(err)
        else {
            
            //@ts-nocheck
            resolve(await doProcessing(data))
        }
    })
})

// stream the results as they are available into myanimated.gif

const FPS = 30
const MS_PER_FRAME = 100 / FPS * 10
// 5 seconds
const GIF_DURATION = 1.2 * 2 * 1
const FRAMES = Math.ceil(GIF_DURATION * MS_PER_FRAME)

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

/**
 * @param {Buffer} imageBuffer
 * @returns {Promise<Discord.Attachment>}
 */
async function createAnimation(imageBuffer) {

    const encoder = new GIFEncoder(WIDTH, HEIGHT);
    const beginTime = new Date().getTime()


    canvas.registerFont("./res/Roboto-Regular.ttf", { family: "Roboto" })

    const ctx = createCanvas(WIDTH, HEIGHT).getContext('2d');

    const animationDuration = 1000 * 1.2


    encoder.start();
    encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
    encoder.setDelay(MS_PER_FRAME)  // frame delay in ms
    encoder.setQuality(20); // image quality. 10 is default.

    console.log("Total frames: " + FRAMES)
    const userProfileImage = new canvas.Image()
    userProfileImage.src = imageBuffer

    const rectWidth = 90
    const rectHeight = 90
    const from = {
        x: (WIDTH / 2) - (rectWidth / 2),
        y: (HEIGHT / 2) - (rectHeight / 2)
    }
    const to = {
        x: from.x,
        y: from.y + 20
    }

    try {
        await animeFrames
    } catch (e) {
        console.log(e)
        return
    }
    const animeGif = await animeFrames

    let animeDelay = 0
    let animeFrame = 0

    const animeImageFrame = canvas.createImageData(new Uint16Array(animeGif.frames[0]), animeGif.width, animeGif.height)

    let lastAnimeUpdate = beginTime

    for (let i = 0; i < FRAMES; i++) {
        const currentTime = beginTime + (i * encoder.delay * 10)


        // /**@type {Buffer} */
        // const buffer = animeGif[animeFrame].pixels
        // animeImageFrame.src = buffer
        // console.log("SRC: (" + typeof animeImageFrame.src)
        // console.log(animeImageFrame.src)

        // console.log("Gif: ")
        // console.log(animeGif[animeFrame])
        // if (currentTime - lastAnimeUpdate >= animeDelay) {
        //     lastAnimeUpdate = currentTime
        //     animeFrame++
        //     if (animeFrame > animeGif.length) animeFrame = 0
        // }

        ctx.save()
        ctx.shadowColor = "rgba(0, 0, 0, 0.13)"
        ctx.shadowBlur = 5

        ctx.shadowOffsetX = 5
        ctx.shadowOffsetY = 5

        const endTime = beginTime + animationDuration


        let time = 1 - ((endTime - currentTime) / animationDuration)
        let timeOnlyDecimals = time
        let positive = true
        while (timeOnlyDecimals > 1) {
            timeOnlyDecimals -= 1
            positive = !positive
        }
        let realTime = timeOnlyDecimals
        if (!positive) realTime = 1 - realTime

        const interpolated = lerpP(from, to, EASE(realTime))

        ctx.restore()
        // reset
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, WIDTH, HEIGHT)
        ctx.save()



        //(image, dx, dy, dWidth, dHeight);
        ctx.save()

        ctx.fillStyle = "#000000"
        function doPath() {
            ctx.beginPath();
            const radius = rectWidth / 2
            const extra = 20
            ctx.arc(interpolated.x + radius, interpolated.y + radius, radius + extra, 0, 2 * Math.PI);
        }
        doPath()
        ctx.stroke()
        doPath()
        ctx.clip()

        ctx.drawImage(userProfileImage, interpolated.x, interpolated.y, rectWidth, rectHeight)

        ctx.restore()

        //ctx.putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
        ctx.putImageData(animeImageFrame, 0, 0, 0, 0, 40, 40)
        ctx.fillStyle = "#ff0000"

        ctx.fillRect(interpolated.x - 2, interpolated.y - 2, 4, 4)

        ctx.fillStyle = "#000000"
        ctx.font = "20px Roboto"

        function drawCentered(x, y, text) {
            const width = ctx.measureText(text).width

            ctx.fillText(text, x - (width / 2), y)
        }
        drawCentered(WIDTH / 2, HEIGHT / 10, "GIF at " + ((currentTime - beginTime) / 1000).toFixed(2) + "s out of " + GIF_DURATION.toFixed(2) + "s")
        drawCentered(WIDTH / 2, HEIGHT / 10 + 20, "Animation at " + time.toFixed(2))

        const duration = GIF_DURATION * 1000
        const progressInterp = 1 - ((beginTime + duration) - currentTime) / duration

        const boxWidth = lerp(0, WIDTH, Easing.Quadratic.In(progressInterp))
        const boxHeight = 30
        ctx.restore()
        ctx.save()
        ctx.fillStyle = "rgba(92, 236, 9, 1)"

        ctx.fillRect(0, HEIGHT - boxHeight, boxWidth, boxHeight)
        ctx.restore()
        encoder.addFrame(ctx)
        console.log(progressInterp)
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
        message.channel.startTyping()
        const th = await request.get(message.author.displayAvatarURL)

        if (th.body instanceof Buffer) {
            message.channel.send("HUGS", await createAnimation(th.body))
        }
        else console.log("wtf")
        message.channel.stopTyping()
    }

}