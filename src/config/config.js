const config = require("./" + (process.env.NODE_ENV == "development" ? "config-testing.json" : "config.json"))

module.exports = config