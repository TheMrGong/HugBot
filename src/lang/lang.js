const messages = require("./messages.json")

class TranslateResult {
    constructor(usedIndex, text) {
        /**@type {number} - Index from array of strings */
        this.usedIndex = usedIndex
        /**@type {string} The translated text */
        this.text = text
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.text
    }
}

/**
 * @param {string} key 
 * @returns {TranslateResult}
 */
function translateAndIndex(key) {
    const messageKeys = key.split(".")
    /** @type {string|Array<string>}*/
    let availableMessages; // key, value, key, value
    messageKeys.forEach(key => {
        if (!availableMessages) availableMessages = messages[key]
        else availableMessages = availableMessages[key]
    })
    const string = typeof availableMessages == "string"

    if (!string && (!availableMessages || availableMessages.length === 0))
        return new TranslateResult(0, "{i dunno about " + key + "}");
    let index = string ? 0 : Math.floor(Math.random() * availableMessages.length)

    for (let k in arguments) {
        /** @type {string} */
        const current = arguments[k]
        const next = parseInt(arguments[parseInt(k) + 1])
        if (current == "$$index" && next !== undefined && next !== -1)
            index = next
    }

    let data =
        string ? availableMessages : availableMessages[index];
    for (let k in arguments) {
        if (k === 0) continue;
        if ((k - 1) % 2 === 0) { //if i'm a key
            const key = arguments[k];
            const value = arguments[parseInt(k) + 1];
            if (!value) continue; // no value for the key
            data = data.replace(`{${key}}`, value);
        }
    }
    return new TranslateResult(index, data.replace(/\\n/g, "\n"))
}

/**
 * @returns {string} Translated text
 */
module.exports = function () {
    return translateAndIndex(...arguments).text
}

module.exports.withIndex = translateAndIndex
module.exports.prefixed = (prefix) => {
    return (...theArgs) => {
        const newArgs = []
        for (let k in theArgs) {
            if (parseInt(k) > 0) newArgs.push(theArgs[k])
        }
        return translateAndIndex(prefix + theArgs[0], ...newArgs).text
    }
}
module.exports.TranslateResult = TranslateResult