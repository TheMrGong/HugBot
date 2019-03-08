/**
 * @typedef {Object} HugAction
 * @property {string} id - Action name in the database
 * @property {number} energy - Amount of energy required to perform the action
 */

/**
 * @enum {HugAction}
 */
export const Action = {
    HUG: {
        id: "hug",
        energy: 3
    },
    TACKLE_HUG: {
        id: "tacklehug",
        energy: 10
    },
    PAT: {
        id: "pat",
        energy: 1
    },
    GLOMP: {
        id: "glomp",
        energy: 5
    }
}

/**
 * @enum {number}
 */
export const TackleResult = {
    DODGED: 1,
    ACCEPTED: 2,
    TOO_LONG: 3
}

module.exports = {
    Action,
    TackleResult
}