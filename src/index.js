const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", msg => {
  if (msg.content === "ping") {
    msg.reply("pong");
  }
});

client.login("NDU4MDM1NjQ1Mzk1MjM4OTM2.D1hA0Q.HciJegmyEf_CFBouVN-yuKxoXyg");
console.log("Did things.");
