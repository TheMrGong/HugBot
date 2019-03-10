//@ts-check
const Discord = require("discord.js")

/**
 * @param {Discord.Message} event 
 * @param {Array<string>} args 
 * @returns {Promise<Array<Discord.GuildMember>>}
 */
async function findAllMembersInEvent(event, args) {
    const mentioned = event.mentions.members.first();

    if (mentioned) return [mentioned]
    const targetting = args.join(" ");
    await event.guild.fetchMembers(targetting, 1)

    return findAllMembersInGuildMatching(event.guild, targetting)
}

/**
 * @param {Discord.Message} event 
 * @param {Array<string>} args 
 * @returns {Promise<Discord.GuildMember|undefined>}
 */
async function findMemberInEvent(event, args) {
    const members = await findAllMembersInEvent(event, args)
    if (members.length > 0) return members[0]
}

/**
 * 
 * @param {Discord.Guild} guild 
 * @param {string} targetting 
 * @returns {Array<Discord.GuildMember|undefined>}
 */
function findAllMembersInGuildMatching(guild, targetting) {
    // find direct match
    let membersFound = findMembersBy(
        guild,
        targetting,
        member => member.displayName,
        true
    );
    // find includes match
    if (membersFound.length == 0) {
        membersFound = findMembersBy(
            guild,
            targetting,
            member => member.displayName
        );
    }
    // find direct username
    if (membersFound.length == 0)
        membersFound = findMembersBy(
            guild,
            targetting,
            member => member.user.username,
            true
        );

    // find includes username
    if (membersFound.length == 0)
        membersFound = findMembersBy(
            guild,
            targetting,
            member => member.user.username
        );

    return membersFound
}

/**
 * Converts a GuildMember into a string
 * @callback transform
 * @param {Discord.GuildMember} transforming
 * @returns {string}
 */

/**
 * 
 * @param {Discord.Guild} guild 
 * @param {string} finding 
 * @param {transform} transform - How to search for the user
 * @param {boolean} direct Checks the names directly
 * @returns {Array<Discord.GuildMember>}
 */
function findMembersBy(guild, finding, transform, direct = false) {
    const entries = guild.members.entries();
    let entry = entries.next();

    /**@type {Array<Discord.GuildMember>} */
    let usersFound = []
    while (entry.value) {
        const name = transform(entry.value[1]);
        if (direct ? name.toLowerCase() == finding.toLowerCase() : name.toLowerCase().includes(finding.toLowerCase()))
            usersFound.push(entry.value[1]);
        entry = entries.next();
    }
    return usersFound
}

module.exports = {
    findAllMembersInEvent,
    findMemberInEvent,
    findMembersBy,
    findAllMembersInGuildMatching
}