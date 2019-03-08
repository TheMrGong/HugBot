//@ts-check

const storage = require("./storage.js");
const hugrecords = require("./records/hugrecords")
const tacklehugs = require("./records/tacklehugrecords")

async function begin() {
  try {
    await hugrecords.databaseCreated
    await tacklehugs.databaseCreated
    const results = await tacklehugs.logTackleHug(0, 1, 2, tacklehugs.TackleResult.ACCEPTED, 5000)
    console.log(results)
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