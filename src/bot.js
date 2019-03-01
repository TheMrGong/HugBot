const Discord = require("discord.js");
const config = require("./config.json");
const messages = require("./messages.json");

let storage;

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("out for hugs.", {
    type: "WATCHING"
  });
});

client.on("message", event => {
  if (event.author.bot || !event.content.toLowerCase().startsWith("?hug"))
    return;
  const spaces = event.content.split(" ");
  if (spaces.length === 1) {
    hugTheBot(event);
  } else {
    const args = [];
    for (let k in spaces) {
      if (k > 0) args.push(spaces[k]);
    }
    const targetting = args.join(" ");
    const user = event.mentions.users.first();

    if (user) {
      hugUser(event, user);
    } else {
      event.guild.fetchMembers(targetting, 1).then(() => {
        let member = findUserBy(
          event,
          targetting,
          member => member.displayName
        );
        if (!member)
          member = findUserBy(
            event,
            targetting,
            member => member.user.username
          );

        if (member) hugUser(event, member.user);
        else
          event.channel.send(
            event.author.toString() + ", your hug failed! Who are you hugging?"
          );
      });
    }
  }
});

function getMessageFor(key, params) {
  const availableMessages = messages[key];
  if (!availableMessages || availableMessages.length === 0)
    return "{i dunno about " + key + "}";
  let replace =
    availableMessages[Math.floor(Math.random() * availableMessages.length)];
  for (let k in arguments) {
    if (k === 0) continue;
    if ((k - 1) % 2 === 0) {
      const key = arguments[k];
      console.log("Got key " + key);
      const value = arguments[k + 1];
      console.log("got value " + value);
      if (!value) continue; // no value for the key
      replace = replace.replace(key, value);
    }
  }
  return replace;
}

function findUserBy(event, finding, transform) {
  const entries = event.guild.members.entries();
  let entry = entries.next();
  while (entry.value) {
    const name = transform(entry.value[1]);
    if (name.toLowerCase().includes(finding.toLowerCase()))
      return entry.value[1];
    entry = entries.next();
  }
}

function hugTheBot(event) {
  const replyingWith = getMessageFor(
    "bot-hugs",
    "{user}",
    event.author.toString()
  );
  console.log(
    event.member.displayName + " hugged me! Replying with " + replyingWith
  );
  event.channel.send(replyingWith);

  storage.logHugEvent(event.guild.id, event.author.id, client.user.id);
}

function hugUser(event, user) {
  if (event.author.id === user.id) {
    event.channel.send(
      "You strongly hug yourself, increasing your self-happiness"
    );
    return;
  } else if (user.id === client.user.id) return hugTheBot(event);
  storage.logHugEvent(event.guild.id, event.author.id, user.id);

  event.channel.send(
    event.author.toString() + " has hugged " + user.toString() + "!!"
  );
  console.log(event.member.displayName + " has hugged " + user.username);

  storage.getTotalHugsSent(event.guild.id, event.author.id).then(hugs => {
    console.log(event.author.username + " has sent " + hugs + " hug(s)");
  });

  storage.getTotalHugsReceived(event.guild.id, user.id).then(hugs => {
    console.log(user.username + " has received " + hugs + " hug(s)");
  });
}

module.exports = function(incomingStorage) {
  storage = incomingStorage;
  client.login(config.token);
  console.log("Logging in...");
};
