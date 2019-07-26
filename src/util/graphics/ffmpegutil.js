//@ts-check
const cp = require('child_process');

/**
 * 
 * @param {number} fps 
 * @param {Array<Buffer>} buffers 
 * @param {number} width 
 * @param {number} height
 * @returns {Promise<Buffer>} Converted gif
 */
async function convertImagesToGif(fps, buffers, width, height) {
    return new Promise(async (resolve, reject) => {


        const ffmpeg = cp.spawn('ffmpeg', [
            '-r',
            `${fps}`,
            '-f',
            'image2pipe',
            '-s',
            `${width}x${height}`,
            '-i',
            '-',
            '-lavfi',
            `palettegen=reserve_transparent=0:stats_mode=diff[pal],[0:v][pal]paletteuse=dither=heckbert:new=1`,//  Take a new pallette for each output frame
            '-f',
            'gif',
            '-r',
            `${fps}`,
            'pipe:1'
        ]) // uncomment for debugging
        // ffmpeg.stderr.on("data", data => {
        //     console.log(data.toString())
        // })

        const totalData = []
        ffmpeg.on("exit", (code, signal) => {
            if (totalData.length == 0) reject("Failed to decode, code " + code + " " + signal)
            else resolve(Buffer.concat(totalData))
        })
        ffmpeg.stdout.on("data", chunk => {
            totalData.push(chunk)
        })

        ffmpeg.stdin.write(Buffer.concat(buffers))
        ffmpeg.stdin.end()

    })
}

module.exports = {
    convertImagesToGif
}