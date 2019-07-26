//@ts-check

const fs = require("fs")

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * @param {string} name 
 * @returns {Promise<Buffer>}
 */
async function readFile(name) {
    return new Promise((resolve, reject) => {
        fs.readFile(name, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        })
    })
}

/**
 * @param {Buffer} buf 
 * @returns {ArrayBuffer}
 */
function toArrayBuffer(buf) {
    console.log(typeof buf)
    console.log("new arraybuffer " + buf.byteLength)
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

function arrayToKeys(...components) {
    const ret = {}
    for (let k in components) {
        const current = components[k]
        const next = parseInt(k) + 1
        if (next % 2 == 0) continue
        if (next >= components.length) break // not even number of components
        ret["{" + current + "}"] = components[next]
    }
    return ret
}

module.exports = {
    shuffle,
    readFile,
    toArrayBuffer,
    arrayToKeys
}