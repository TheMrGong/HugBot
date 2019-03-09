//@ts-check
const Discord = require("discord.js");
const config = require("./config/config.js");

const client = new Discord.Client();
const commandhandler = require("./command/commandhandler")

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("out for hugs.", {
    type: "WATCHING"
  });
});

function begin() {
  client.login(config.token)
  commandhandler.setup(client)
  console.log("Logging in...")
}

module.exports = {
  begin
}