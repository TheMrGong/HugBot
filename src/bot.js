const Discord = require("discord.js");
const config = require("./config.json");
const lang = require("./lang.js")
const tacklehugApi = require("./tacklehug.js")

// ADD pats

const DELETE_AFTER = 1000 * 10

let storage;

const client = new Discord.Client();
const tackleHug = tacklehugApi(client)

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("out for hugs.", {
    type: "WATCHING"
  });
});

client.on("message", event => {
  if (event.author.bot && event.embeds[0] && event.embeds[0].description && (event.embeds[0].description.toLowerCase().includes("?hug") || event.embeds[0].description.toLowerCase().includes("?tacklehug"))) {
    event.delete()
    return
  }
  if (event.author.bot)
    return;

  if (!event.content.toLowerCase().startsWith("?")) {
    return processHugsInMessage(event)
  }

  const spaces = event.content.split(" ");
  const cmd = spaces[0].toLowerCase().substring(1, spaces[0].length).replace(/[^\w]/gm, "")
  const args = [];
  for (let k in spaces) {
    if (k > 0) args.push(spaces[k]);
  }
  if (cmd == "hug")
    hugCommand(event, args)
  else if (cmd == "hugs")
    hugStatsCommand(event, args)
  else if (cmd == "tacklehug" || cmd == "hugtackle")
    tackleHugCommand(event, args)
});

function processHugsInMessage(event) {
  const mentioned = event.mentions.members.first()

  const lower = event.content.toLowerCase()
  const regex = /(?: ?<@!\d+> ?)?\bhug\b(?: ?<@!\d+> ?)?/gm

  if (regex.exec(lower) !== null && mentioned)
    hugUser(event, mentioned.user)
}

async function findMemberInEvent(event, args) {
  const mentioned = event.mentions.members.first();

  if (mentioned) return mentioned
  const targetting = args.join(" ");
  await event.guild.fetchMembers(targetting, 1)

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

  if (member) return member
}

async function tackleHugCommand(event, args) {
  if (args.length == 0) return event.channel.send(lang("hug-tackle.unspecified", "user", event.author.toString()))

  const member = await findMemberInEvent(event, args)
  const tackling = args.join(" ")

  if (!member) return event.channel.send(lang("hug-tackle.not-found", "user", event.author.toString(), "tackling", tackling))
  if (member.id == event.author.id) return event.channel.send(lang("hug-tackle.self", "user", event.author.toString()))

  event.delete()
  tackleHug.beginTackleHug(event, member)
}

async function hugCommand(event, args) {
  if (args.length == 0) return hugTheBot(event)
  const member = await findMemberInEvent(event, args)
  if (member) hugUser(event, member.user)
  else event.channel.send(
    lang("hug-fail", "user", event.author.toString(), "hugging", targetting)
  );
}

async function hugStatsCommand(event, args) {
  event.delete()
  if (args.length == 0) {
    showHugStatsFor(event, event.member);
  } else {

    const member = await findMemberInEvent(event, args)
    if (member)
      showHugStatsFor(event, member)
    else event.channel.send(
      lang("hug-stats-nofind", "user", event.author.toString(), "finding", targetting)
    );
  }
}

async function showHugStatsFor(event, member) {
  const stats = await storage.getUserInfo(event.guild.id, member.id)
  const self = event.author.id === member.id
  if (!stats) {
    return event.channel.send(lang(self ? "hug-stats-self-never" : "hug-stats-never-hugged", "user", event.author.toString(), "found", member.displayName))
      .then(message => message.delete(DELETE_AFTER))
  }
  const hugs = stats.hugsReceived + " hug" + (stats.hugsReceived == 1 ? "" : "s")
  if (self) {
    event.channel.send(lang("hug-stats-self-received", "user", event.author.toString(), "hugs", hugs))
      .then(message => message.delete(DELETE_AFTER))
  } else event.channel.send(lang("hug-stats-other-received", "user", event.author.toString(), "hugs", hugs, "found", member.displayName))
    .then(message => message.delete(DELETE_AFTER))
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
  const replyingWith = lang(
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
      lang("hug-self", "user", event.author.toString())
    );
    return;
  } else if (user.id === client.user.id) return hugTheBot(event);
  event.delete()
  storage.logHugEvent(event.guild.id, event.author.id, user.id)

  if (event.mentions.users.array().length > 0) {
    event.channel.send(
      lang("hug-other", "hugger", event.author.toString(), "hugged", user.toString())
    );
  } else {
    event.guild.fetchMember(user).then(member => {
      event.channel.send(
        lang("hug-other", "hugger", event.author.toString(), "hugged", `\`\`${member.displayName}\`\``)
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