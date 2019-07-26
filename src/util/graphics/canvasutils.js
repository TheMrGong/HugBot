//@ts-check

const canvasAPI = require("canvas")
const { wrapImage } = require("./gifutil")

canvasAPI.registerFont("./res/Whitney.ttf", { family: "Whitney" })
canvasAPI.registerFont("./res/Whitney Medium.ttf", { family: "Whitney-Medium" })
canvasAPI.registerFont("./res/Whitney Book.ttf", { family: "Whitney-Book" })
canvasAPI.registerFont("./res/Roboto-Regular.ttf", { family: "Roboto" })

/**
 * @typedef {Object} RadiusConfig
 * @property {number} tl
 * @property {number} tr
 * @property {number} br
 * @property {number} bl
 */

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {number|RadiusConfig} radius Roundness on corners
 */
function doRoundRectPath(ctx, x, y, width, height, radius) {
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
        for (let side in defaultRadius) {
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

/**
 * @param {canvasAPI.Canvas} canvas
 * @returns {Promise<Buffer>}
 */
async function asyncCanvasToBuffer(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBuffer((err, buf) => {
            if (!buf) reject(err)
            else resolve(buf)
        })
    })
}

function getColorIndicesForCoord(x, y, width) {
    const red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
};

/**
 * @param {canvasAPI.Image} mask 
 * @param {number} width 
 * @param {number} height 
 * @returns {canvasAPI.Image}
 */
function convertFrameWithMasking(mask, width, height) {
    const canvas = canvasAPI.createCanvas(width, height)
    const context = canvas.getContext("2d")

    try {
        context.drawImage(mask, 0, 0)
    } catch (e) {
        console.log(e)
    }
    const imageData = context.getImageData(0, 0, width, height)

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const [redIndex, greenIndex, blueIndex, alphaIndex] = getColorIndicesForCoord(x, y, canvas.width);
            if (imageData.data[alphaIndex] < 255) console.log("Non-full alpha found")
            imageData.data[alphaIndex] = Math.floor((imageData.data[redIndex] + imageData.data[greenIndex] + imageData.data[blueIndex]) / 3)
            if (imageData.data[alphaIndex] > 0) console.log("- " + imageData.data[alphaIndex])
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

/**
 * 
 * @param {canvasAPI.Image} image 
 * @param {number} imageX
 * @param {number} imageY
 * @param {canvasAPI.Image} mask 
 */
async function maskImageWith(image, imageX, imageY, mask) {
    const imgCanvas = canvasAPI.createCanvas(image.width, image.height)
    const imgCtx = imgCanvas.getContext("2d")

    imgCtx.drawImage(image, 0, 0)
    const imgData = imgCtx.getImageData(0, 0, image.width, image.height)

    const maskCanvas = canvasAPI.createCanvas(mask.width, mask.height)
    const maskCtx = maskCanvas.getContext("2d")

    maskCtx.drawImage(mask, 0, 0)
    const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height)

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
            const [rI, gI, bI, aI] = getColorIndicesForCoord(x, y, image.width);
            const [rM, gM, bM, aM] = getColorIndicesForCoord(x + imageX, y + imageY, mask.width)
            imgData.data[aI] = Math.floor((maskData.data[rM] + maskData.data[gM] + maskData.data[bM]) / 3)
        }
    }

    imgCtx.putImageData(imgData, 0, 0)
    return wrapImage(await asyncCanvasToBuffer(imgCanvas))
}

/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {number|RadiusConfig} radius Roundness on corners
 */
function drawRoundRectangle(ctx, x, y, width, height, radius) {
    ctx.save()
    //@ts-ignore
    doRoundRectPath(...arguments)
    ctx.fill()
    ctx.restore()
}

module.exports = {
    doRoundRectPath,
    drawRoundRectangle,
    convertFrameWithMasking,
    maskImageWith
}