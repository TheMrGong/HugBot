/**
 * @param {number} time 
 * @returns {number} Time within 0-1
 */
function loopTime(time) {
    const number = Math.floor(time)
    const positive = number % 2 == 0
    return !positive ? 1 - (time - number) : (time - number)
}

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
 * Lerps between two objects, 
 * the returning object having the interpolated
 * values of each object when they have matching properties
 * 
 * @param {Object} begin 
 * @param {Object} end 
 * @param {number} time 
 */
function lerpO(begin, end, time) {
    const interpolated = {}
    for (let k in begin) {
        const beginO = begin[k]
        const endO = end[k]
        if (typeof beginO == 'number' && typeof endO == 'number')
            interpolated[k] = interp(beginO, endO, time)
    }
    return interpolated
}

function resetTime(time) {
    while (time > 1) {
        time -= 1
    }
    return time
}

module.exports = {
    loopTime, lerp, lerpO, resetTime
}