const {ShardingManager} = require("discord.js")
const config = require("./config")

const manager = new ShardingManager(`./src/begin.js`, { token: config.token })

manager.on(`launch`, (shard) => console.log(`Launched shard ${shard.id}`))
manager.spawn()