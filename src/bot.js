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
  if (event.author.bot && event.embeds.length > 0 && event.embeds[0].description.toLowerCase().includes("?hug")) {
    event.delete()
    return
  }
  if (event.author.bot || !event.content.toLowerCase().startsWith("?"))
    return;


  const spaces = event.content.split(" ");
  const cmd = spaces[0].toLowerCase().substring(1, spaces[0].length)
  const args = [];
  for (let k in spaces) {
    if (k > 0) args.push(spaces[k]);
  }
  if (cmd == "hug")
    hugCommand(event, args)
  else if (cmd == "hugs")
    hugStatsCommand(event, args)
});

function hugCommand(event, args) {
  if (args.length == 0) {
    hugTheBot(event);
  } else {

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
            getMessageFor("hug-fail", "user", event.author.toString(), "hugging", targetting)
          );
      });
    }
  }
}

function hugStatsCommand(event, args) {
  event.delete()
  if (args.length == 0) {
    showHugStatsFor(event, event.member);
  } else {

    const targetting = args.join(" ");
    const member = event.mentions.members.first();

    if (member) {
      showHugStatsFor(event, member);
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

        if (member) showHugStatsFor(event, member);
        else
          event.channel.send(
            getMessageFor("hug-stats-nofind", "user", event.author.toString(), "finding", targetting)
          );
      });
    }
  }
}

async function showHugStatsFor(event, member) {
  const stats = await storage.getUserInfo(event.guild.id, member.id)
  const self = event.author.id === member.id
  if (!stats) {
    return event.channel.send(getMessageFor(self ? "hug-stats-self-never" : "hug-stats-never-hugged", "user", event.author.toString(), "found", member.displayName))
  }
  const hugs = stats.hugsReceived + " hug" + (stats.hugsReceived == 1 ? "" : "s")
  if (self) {
    event.channel.send(getMessageFor("hug-stats-self-received", "user", event.author.toString(), "hugs", hugs))
  } else event.channel.send(getMessageFor("hug-stats-other-received", "user", event.author.toString(), "hugs", hugs, "found", member.displayName))
}

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
      const value = arguments[parseInt(k) + 1];
      if (!value) continue; // no value for the key
      replace = replace.replace(`{${key}}`, value);
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
    "user",
    event.author.toString()
  );
  console.log(
    event.member.displayName + " hugged me! Replying with " + replyingWith
  );
  event.channel.send(replyingWith)

  storage.logHugEvent(event.guild.id, event.author.id, client.user.id);
}

function hugUser(event, user) {
  if (event.author.id === user.id) {
    event.delete()
    event.channel.send(
      getMessageFor("hug-self", "user", event.author.toString())
    );
    return;
  } else if (user.id === client.user.id) return hugTheBot(event);
  event.delete()
  storage.logHugEvent(event.guild.id, event.author.id, user.id)

  if (event.mentions.users.array().length > 0) {
    event.channel.send(
      getMessageFor("hug-other", "hugger", event.author.toString(), "hugged", user.toString())
    );
  } else {
    event.guild.fetchMember(user).then(member => {
      event.channel.send(
        getMessageFor("hug-other", "hugger", event.author.toString(), "hugged", `\`\`${member.displayName}\`\``)
      );
    })
  }

  console.log(event.member.displayName + " has hugged " + user.username);

}

module.exports = function (incomingStorage) {
  storage = incomingStorage;
  client.login(config.token);
  console.log("Logging in...");
};