//@ts-check
const Discord = require("discord.js");
const config = require("./config");

const client = new Discord.Client();
const commandhandler = require("./command/commandhandler")

const energyhandler = require("./database/energy/energyhandler")

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("out for hugs.", {
    type: "WATCHING"
  });
});

function begin() {
  client.login(config.token)
  commandhandler.setup(client)
  energyhandler.begin(client)
  console.log("Logging in...")
}

module.exports = {
  begin
}