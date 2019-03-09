//@ts-check

const storage = require("./storage.js");
const hugrecords = require("./records/hugrecords")
const energyapi = require("./energy/energyapi")

async function begin() {
  try {
    await Promise.all([hugrecords.ready, energyapi.ready])
    const added = await energyapi.addEnergy(1, 0, 1)
    const energy = await energyapi.getEnergy(1, 0)
    console.log("Energy: " + energy.energy + " removed - " + energy.lastRemoved)
    await energyapi.removeEnergy(1, 0, 1)
  } catch (e) {
    console.log(e)
    return
  }
  storage
    .load()
    .then(created => {
      if (!created) return console.log("Failed to setup database.")
      const bot = require("./bot.js");
      bot(storage);
    })
    .catch(reason => {
      console.log("Failed to load storage: " + reason);
    });
}

process.on('uncaughtException', function (err) {
  console.log(err)
  console.log(err.message)
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  process.exit(1)
})

begin()