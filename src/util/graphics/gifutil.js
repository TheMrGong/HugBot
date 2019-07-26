//@ts-check

const canvasAPI = require("canvas")
const sharp = require("sharp")
const request = require("snekfetch")
const gifFrames = require("gif-frames")
const { FrameInfo } = require("./animatorutil")

const MINIMUM_DELAY = 10

/**
 * @param {string} url 
 */
async function getGifFramesCorrectly(url) {
    let config = { url, outputType: "png", frames: 1, cumulative: true }
    //@ts-ignore
    let frames = await gifFrames(config)
    //@ts-ignore
    config.frames = "all"
    if (frames[0].frameInfo.disposal == 2) config.cumulative = false // check for different types of gifs

    //@ts-ignore
    return await gifFrames(config)
}

/**
 * 
 * @param {Array<any>} frames 
 */
function caclulateGifDuration(frames) {
    let lengthInMillis = 0
    for (let k in frames) {
        const info = frames[k].frameInfo
        let delay = info.delay == 0 ? MINIMUM_DELAY : info.delay
        lengthInMillis += delay * 10
    }
    return lengthInMillis
}

/**
 * @callback DrawTo
 * @param {FrameInfo} f
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
/**
 * @typedef {Object} ImageDrawerConfig
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [duration] - milliseconds
 */

/**
 * @typedef {Object} GifInfo
 * @property {number} duration
 * @property {number} fps
 * @property {number} width
 * @property {number} height
*/

/**
 * @typedef {Object} ProfileImageDrawer
 * @property {function(FrameInfo):number} getCurrentIndex
 * @property {DrawTo} draw
 * @property {function(FrameInfo):Buffer} getCurrentImage
 * @property {GifInfo} [gifInfo]
 */

/**
 * @param {string} url 
 * @param {ImageDrawerConfig} [imageConfig] - If set, the animation will try to take this long to complete
 * @returns {Promise<ProfileImageDrawer>}
 */
async function createURLImageDrawer(url, imageConfig) {
    if (!imageConfig) imageConfig = {}

    if (imageConfig.height !== undefined && imageConfig.width === undefined)
        imageConfig.width = imageConfig.height
    if (imageConfig.width !== undefined && imageConfig.height === undefined)
        imageConfig.height = imageConfig.width


    if (url.endsWith(".gif")) {
        return await createGifDrawer(await getGifFramesCorrectly(url), imageConfig)
    } else {
        let profileImageBuffer = (await request.get(url)).body

        //@ts-ignore
        if (imageConfig.width !== undefined) profileImageBuffer = await sharp(profileImageBuffer).resize(imageConfig.width, imageConfig.height).toBuffer()

        if (!(profileImageBuffer instanceof Buffer)) throw "Not a buffer?"
        const response = {
            getCurrentIndex(f) {
                return 0;
            },
            /**@returns {Buffer} */
            getCurrentImage(f) {
                //@ts-ignore
                return profileImageBuffer
            },
            draw: async function (f, x, y, width, height) {
                f.ctx.drawImage(wrapImage(this.getCurrentImage(f)), x, y, width, height)
            }
        }
        return response
    }
}

/**
 * 
 * @param {Array<any>} frames 
 * @param {ImageDrawerConfig} imageConfig 
 * @returns {Promise<ProfileImageDrawer>}
 */
async function createGifDrawer(frames, imageConfig) {
    let lengthInMillis = caclulateGifDuration(frames)

    /**@type {Array<Buffer>} */
    const frameImages = []

    let width, height;

    for (let k in frames) {
        const frame = frames[k]
        width = frame.frameInfo.width;
        height = frame.frameInfo.height;

        let imageBuffer;
        imageBuffer = await readImage(frame.getImage())
        if (imageConfig.width !== undefined)
            frameImages.push(await sharp(imageBuffer).resize(imageConfig.width, imageConfig.height).toBuffer())
        else frameImages.push(imageBuffer)
    }
    let lastIndex = 0
    const response = {
        /**
         * 
         * @param {FrameInfo} f 
         * @returns {number}
         */
        getCurrentIndex(f) {
            const gotDelay = frames[lastIndex].frameInfo.delay
            let delay = (gotDelay == 0 ? MINIMUM_DELAY : gotDelay) * 10
            let gifIndex = Math.floor(f.currentTime / delay)
            while (gifIndex >= frames.length) gifIndex = gifIndex - frames.length // loop gif

            lastIndex = gifIndex

            return gifIndex
        },
        draw: function (f, x, y, width, height) {
            f.ctx.drawImage(wrapImage(this.getCurrentImage(f)), x, y, width, height)
        },
        /**
         * 
         * @param {FrameInfo} f 
         * @returns {Buffer}
         */
        getCurrentImage(f) {
            return frameImages[this.getCurrentIndex(f)]
        },
        gifInfo: {
            duration: lengthInMillis,
            fps: frames.length / (lengthInMillis / 1000),
            width,
            height
        }
    }
    return response
}

/**
 * @param {any} stream 
 * @returns {Promise<Buffer>}
 */
async function readImage(stream) {
    return new Promise(resolve => {
        const buffers = []
        stream.on("data", (data) => {
            buffers.push(data)
        })
        stream.on("end", () => {
            resolve(Buffer.concat(buffers))
        })
    })
}

/**
 * @param {Buffer} buffer 
 * @returns {canvasAPI.Image}
 */
function wrapImage(buffer) {
    const image = new canvasAPI.Image()
    image.src = buffer
    return image
}

module.exports = {
    getGifFramesCorrectly,
    caclulateGifDuration,
    createURLImageDrawer,
    wrapImage,
    readImage
}