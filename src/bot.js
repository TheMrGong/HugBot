//@ts-check
const Discord = require("discord.js");
const config = require("./config");

const client = new Discord.Client();
const commandhandler = require("./command/commandhandler")
const actionsRegistry = require("./hug/action/actionsregistry")

const energyhandler = require("./hug/energy/energyhandler")

const preferences = require("./preference/prefenceapi")
//const chatbot = require("./hug/chatbot")

const hal = require("./hal")

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("out for hugs.", {
    type: "WATCHING"
  });
});

client.on("error", err => {
  console.error("Discord got an error")
  console.error(err)
})

async function begin() {
  console.log("Logging in...")
  await client.login(config.token)

  // client.guilds.forEach(async g => {
  //   console.log(g.name + " - " + g.id)
  // })


  console.log("Waiting for preferences...")
  await preferences.ready
  console.log("Setting up hal...")
  hal.begin(client)
  console.log("Setting up commands...")
  commandhandler.setup(client)
  console.log("Setting up energy handling...")
  energyhandler.begin(client)
  console.log("Registering actions...")
  actionsRegistry.register(client)
  console.log("Done. Currently apart of " + client.guilds.size + " guilds")
}

module.exports = {
  begin,
  client
}