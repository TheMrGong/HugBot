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
 * @property {DatabaseConfig} mysql
 * @property {string} prefix
 */

/**@type {HugConfig} */
const config = require("../" + (process.env.NODE_ENV == "development" ? "config-testing.json" : "config.json"))

module.exports = config