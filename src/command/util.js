//@ts-check
const Discord = require("discord.js")

/**
 * @param {Discord.Message} event 
 * @param {Array<string>} args 
 */
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

/**
 * Converts a GuildMember into a string
 * @callback transform
 * @param {Discord.GuildMember} transforming
 * @returns {string}
 */
/**
 * 
 * @param {Discord.Message} event 
 * @param {string} finding 
 * @param {transform} transform - How to search for the user
 * @returns {Discord.GuildMember|undefined}
 */
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

module.exports = findMemberInEvent