//@ts-check

const config = require("../../config")

const sapcai = require('sapcai').default

//@ts-ignore
const connect = new sapcai.connect(config.chatbot_token)

//@ts-ignore
const request = new sapcai.request(config.chatbot_token)

const preferenceApi = require("../../preference/prefenceapi")
const GONGO = "192813299409223682"

const client = require("../../bot").client
const discordUtils = require("../../util/discordutil")

class Action {
    /**
     * @param {boolean} enabling 
     */
    constructor(enabling) {
        this.enabling = enabling
    }

    async applyAction(guildId, userId) { }
}

class SelfAction extends Action {
    /**
     * @param {boolean} enabling 
     */
    constructor(enabling) {
        super(enabling)
    }

    async applyAction(guildId, userId) {
        const preferences = await preferenceApi.getPreferences(guildId, userId)
        const hugPreference = preferences.filter(it => it.name == "accept-hugs")[0]
        if (hugPreference) {
            await hugPreference.update(this.enabling ? "true" : "false")
        }
    }
}

class OtherAction extends Action {
    /**
     * @param {boolean} enabling 
     */
    constructor(enabling) {
        super(enabling)
    }

    async applyAction(guildId, userId, finding) {
        const guild = client.guilds.get(guildId)
        if (!guild) throw new Error("GENERAL - Couldn't find guild")
        if (userId != GONGO) {
            const user = await client.fetchUser(userId)
            if (user) {
                const member = await guild.fetchMember(user)
                if (member) {
                    if (!member.hasPermission("MANAGE_MESSAGES")) throw new Error("PERMISSION - Member didn't have permissions to change other's preferences")
                } else throw new Error("GENERAL - Member not found in guild")
            } else throw new Error("GENERAL - Invalid user id")
        }

        const found = discordUtils.findAllMembersInGuildMatching(guild, finding)
        if (found.length != 1) throw new Error("NOT_FOUND - Couldn't find referenced user")

        const preferences = await preferenceApi.getPreferences(guildId, found[0].id)
        const hugPreference = preferences.filter(it => it.name == "accept-hugs")[0]
        if (hugPreference) {
            await hugPreference.update(this.enabling ? "true" : "false")
        }
    }
}

async function sendConversation(guildId, userId, message, properties) {
    const conversation = await request.converseText(message, {
        conversationToken: guildId + "-" + userId,
        memory: properties ? properties : {}
    })
    console.log(conversation)
}

sendConversation("BEPIS", "Can I disable hugs?")