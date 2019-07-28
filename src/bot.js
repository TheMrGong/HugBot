//@ts-check
const Discord = require("discord.js");
const config = require("./config");

const client = new Discord.Client();
const commandhandler = require("./command/commandhandler")
const actionsRegistry = require("./hug/action/actionsregistry")

const energyhandler = require("./hug/energy/energyhandler")

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

  client.guilds.forEach(async g => {
    console.log(g.name + " - " + g.id)
  })

  hal.begin(client)
  commandhandler.setup(client)
  energyhandler.begin(client)
  actionsRegistry.register(client)
}

module.exports = {
  begin
}