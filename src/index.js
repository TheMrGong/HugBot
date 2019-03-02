process.stdout = {};
process.stderr = {};

const storage = require("./storage.js");

storage
  .load()
  .then(() => {
    const bot = require("./bot.js");
    bot(storage);
  })
  .catch(reason => {
    console.log("Failed to load storage: " + reason);
  });
