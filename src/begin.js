//@ts-check
//TODO preferences

const hugrecords = require("./hug/records/hugrecords")
const energyapi = require("./hug/energy/energyapi")
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
})

process.on('exit', function () {
  console.log('Process terminating.')
});

begin()