//@ts-check

const storage = require("./storage.js");
const hugrecords = require("./records/hugrecords")
const energyapi = require("./energy/energyapi")
const bot = require("./bot")

async function begin() {
  try {
    await Promise.all([hugrecords.ready, energyapi.ready])
    const added = await energyapi.addEnergy(1, 0, 1)
    const energy = await energyapi.getEnergy(1, 0)
    console.log("Energy: " + energy.energy + " removed - " + energy.lastRemoved)
    await energyapi.removeEnergy(1, 0, 1)

    const created = await storage.load()
    if (!created) return console.log("Failed to setup database.")
    bot.begin()
  } catch (e) {
    console.log(e)
    return
  }
}

process.on('uncaughtException', function (err) {
  console.log(err)
  console.log(err.message)
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  process.exit(1)
})

begin()