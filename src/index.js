
if (!process.stout) {
  process.stdout = {};
  process.stderr = {};
}

const storage = require("./storage.js");

storage
  .load()
  .then(created => {
    if(!created) return console.log("Failed to setup database.")
    const bot = require("./bot.js");
    bot(storage);
  })
  .catch(reason => {
    console.log("Failed to load storage: " + reason);
  });

process.on('uncaughtException', function (err) {
  console.log(err)
  console.log(err.message)
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  process.exit(1)
})