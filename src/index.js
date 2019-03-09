//@ts-check

const hugrecords = require("./records/hugrecords")
const energyapi = require("./energy/energyapi")
const bot = require("./bot")

async function begin() {
  try {
    await Promise.all([hugrecords.ready, energyapi.ready])

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

process.on('exit', function () {
  console.log('Process terminating.')
});

begin()