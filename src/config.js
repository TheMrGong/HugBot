/**
 * @typedef {Object} DatabaseConfig
 * @property {string} host
 * @property {number} port
 * @property {string} database
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} HugConfig
 * @property {string} token
 * @property {string} discordgg
 * @property {string} iconguild
 * @property {string} chatbot_token
 * @property {DatabaseConfig} mysql
 * @property {string} prefix
 * @property {Object.<string, string>} customPrefixes
 */

/**@type {HugConfig} */
const config = require("../" + (process.env.NODE_ENV == "development" ? "config-testing.json" : "config.json"))

config.customPrefixes = {
    "721965307022934086": `hug!`,
    "715715394157019229": `b!`,
    "811972420428759050": `&`,
    "816986198321004564": "%"
}

module.exports = config