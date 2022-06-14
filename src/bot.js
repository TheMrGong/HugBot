//@ts-check
const Discord = require("discord.js");
const config = require("./config");
const chalk = require("chalk")

const client = new Discord.Client();
const commandhandler = require("./command/commandhandler")
const actionsRegistry = require("./hug/action/actionsregistry")

const energyhandler = require("./hug/energy/energyhandler")

const preferences = require("./preference/prefenceapi")
const setupStatistics = require("./discordbots")
//const chatbot = require("./hug/chatbot")

const hal = require("./hal")

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("out for hugs.", {
    type: "WATCHING"
  });
});

client.on("message", (message) => {
  if (!message.guild && !message.author.bot) {
    console.log("We got a message from " + message.author.username + "#" + message.author.discriminator + ": " + message.content)
    message.channel.send("*stares blankly*\ni don't do stuff outside of servers, chief\nIf ya want to invite me to a server, here's the link\nhttps://discord.com/api/oauth2/authorize?client_id=715694595073114193&permissions=67430464&scope=bot%20applications.commands")
  }
})

client.on("error", err => {
  console.error("Discord got an error")
  console.error(err)
  if(err.message.includes("RSV2 and RSV3")) {
    console.error(`Restarting due to bullshit`)
    process.exit(-1)
  }
})

client.on("guildCreate", g => {
  console.info(chalk.yellow("THE BOT HAS JOINED A NEW GUILD: " + g.name + ", total guilds: " + g.client.guilds.size))
})

client.on("guildDelete", g => {
  console.info(chalk.bgRedBright("THE BOT LEFT A GUILD!? " + g.name + ", total guilds: " + g.client.guilds.size))
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