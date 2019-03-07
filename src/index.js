
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
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  console.log(err)
  process.exit(1)
})