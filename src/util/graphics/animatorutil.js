//@ts-check

const canvasAPI = require("canvas")
const ffmpegUtil = require("./ffmpegutil")
const { loopTime, resetTime } = require("./tween/interpolationutil")
const interp = require("./tween/interpolationutil")

canvasAPI.registerFont("./res/Whitney.ttf", { family: "Whitney" })
canvasAPI.registerFont("./res/Whitney Medium.ttf", { family: "Whitney-Medium" })
canvasAPI.registerFont("./res/Roboto-Regular.ttf", { family: "Roboto" })

class FrameInfo {
    /**
     * 
     * @param {AnimationContext} animation 
     * @param {number} frame 
     * @param {canvasAPI.CanvasRenderingContext2D} ctx 
     */
    constructor(animation, frame, ctx) {
        this.animation = animation
        this.frame = frame
        this.ctx = ctx
    }

    /**@returns {number} Time elapsed */
    get currentTime() {
        return this.frame * this.animation.msPerFrame
    }

    /** 
     * @param {number} animationDuration 
     * @param {"loop"|"stop"|"continue"|"reset"} [type] What to do if the return values goes over 1
     * @param {number} beginTime - When to begin the animation
     * @returns {number} 0-1 based on animation duration
     */
    getAnimationProgress(animationDuration, type = "loop", beginTime = 0) {
        const currentTime = this.currentTime - beginTime
        if (currentTime < 0) return 0

        const ret = 1 - ((animationDuration - currentTime) / animationDuration)
        if (type == "continue") return ret
        else if (type == "loop") return loopTime(ret)
        else if (type == "reset") return resetTime(ret)
        else return Math.min(ret, 1) // stop
    }

    /**
     * 
     * @param {number} begin 
     * @param {number} end 
     * @param {number} duration 
     * @param {function(number): number} [tween] Defaults to quadratic tween
     * @param {"loop"|"stop"|"continue"|"reset"} [type] What to do if the return values goes over 1
     * @param {number} [beginTime] - When to begin the animation
     */
    lerp(begin, end, duration, tween = (t) => t * t, type = "loop", beginTime = 0) {
        const time = tween(this.getAnimationProgress(duration, type, beginTime))
        return interp.lerp(begin, end, time)
    }
}

class AnimationContext {

    /**
     * @callback RenderCallback
     * @param {FrameInfo} frame
     */

    /**
     * @param {number} fps 
     * @param {number} animationDuration Duration of animation in milliseconds
     * @param {number} width
     * @param {number} height
     * @param {RenderCallback} renderCallback
     */
    constructor(fps, animationDuration, width, height, renderCallback) {
        this.fps = fps
        this.duration = animationDuration
        this.width = width
        this.height = height
        this.renderCallback = renderCallback
        this.backgroundColor = "#ffffff"


        //console.log("Doing frames " + this.totalFrames)
    }

    /**@returns {number} Milliseconds between each frame */
    get msPerFrame() {
        return Math.round(100 / this.fps) * 10
    }

    /**@returns {number} Total amount of frames */
    get totalFrames() {
        return Math.ceil(this.duration / this.msPerFrame)
    }

    /**
     * Allows temporary modifications to the context with automatic restore
     * 
     * @param {function(AnimationContext, canvasAPI.CanvasRenderingContext2D): void} callback
     * @param {canvasAPI.CanvasRenderingContext2D} ctx
     */
    modifyContext(callback, ctx) {
        ctx.save()
        callback(this, ctx)
        ctx.restore()
    }

    /**@returns {canvasAPI.Canvas} */
    getCanvas() {
        const canvas = canvasAPI.createCanvas(this.width, this.height)
        const ctx = canvas.getContext("2d")
        ctx.patternQuality = 'best';
        ctx.antialias = 'subpixel';
        ctx.filter = 'best';
        return canvas
    }

    /**
     * @param {number} frame
     * @returns {Promise<canvasAPI.Canvas>} 
     */
    async renderFrame(frame) {

        const canvas = this.getCanvas()
        const ctx = canvas.getContext("2d")
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0, 0, this.width, this.height)

        const got = this.renderCallback(new FrameInfo(this, frame, ctx))
        if (got instanceof Promise) await got

        return canvas
    }

    /**
     * @param {number} frame
     * @returns {Promise<Object>}
    */
    async getNextFramePNG(frame) {
        const canvas = await this.renderFrame(frame)

        const buffer = await new Promise((resolve, reject) => {
            canvas.toBuffer((err, buf) => {
                if (!buf) reject(err)
                else resolve(buf)
            })
        })
        return {
            buffer,
            frame
        }
    }

    /**@returns {Promise<Array<Buffer>>} */
    async getAllPNGs() {
        /**@type {Array<Promise<any>>} */

        const queuedFrames = []
        let frame = 0
        while (frame < this.totalFrames) {
            queuedFrames.push(this.getNextFramePNG(frame))
            frame++
        }
        const got = await Promise.all(queuedFrames)

        return got.sort((b1, b2) => b1.frame - b2.frame).map(it => it.buffer)
    }

    /**
     * @param {function(string):void} [statusCallback]
     * @returns {Promise<Buffer>} Buffer containing GIF
     */
    async generateGif(statusCallback) {
        if (!statusCallback) statusCallback = () => { }

        const begin = new Date().getTime()
        statusCallback("<a:loading:393852367751086090>Generating...")
        const pngs = await this.getAllPNGs()

        //console.log("Took " + ((new Date().getTime() - begin) / 1000) + "s to generate pngs")
        const beganFFMPEG = new Date().getTime()
        statusCallback("<a:loading:393852367751086090>Encoding...")
        const converted = await ffmpegUtil.convertImagesToGif(this.fps, pngs, this.width, this.height)
        //console.log("Took " + ((new Date().getTime() - begin) / 1000) + " seconds total (" + ((new Date().getTime() - beganFFMPEG) / 1000) + "s for ffmpeg)")
        return converted
    }
}

module.exports = {
    AnimationContext,
    FrameInfo
}