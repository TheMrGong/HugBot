const messages = require("./messages.json")

function translateAndIndex(key) {
    const messageKeys = key.split(".")
    let availableMessages; // key, value, key, value
    messageKeys.forEach(key => {
        if (!availableMessages) availableMessages = messages[key]
        else availableMessages = availableMessages[key]
    })
    const string = typeof availableMessages == "string"

    if (!string && (!availableMessages || availableMessages.length === 0))
        return "{i dunno about " + key + "}";
    let index = string ? 0 : Math.floor(Math.random() * availableMessages.length)

    for (let k in arguments) {
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
    const ret = {
        text: data,
        usedIndex: index,
        toString() {
            return this.text
        }
    }
    return ret
}

module.exports = function (key) {
    return translateAndIndex(...arguments).text
}

module.exports.withIndex = translateAndIndex