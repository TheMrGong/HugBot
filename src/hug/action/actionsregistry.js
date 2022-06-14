//@ts-check

const Discord = require("discord.js")

const { HugActionBuilder, HugActions } = require("./hugaction")

const actions = [
    new HugActionBuilder(HugActions.GLOMP).detect("single").emoji("716744031706677269").build(),
    new HugActionBuilder(HugActions.POKE).detect("single").emoji("716744238359904266").build(),
    new HugActionBuilder(HugActions.HUG).detect("single").emoji("716744608180207647").build(),
    new HugActionBuilder(HugActions.TICKLE).detect("single").emoji("716744486507642882").build(),
    new HugActionBuilder(HugActions.BOOP).detect("single").emojiText("👉").build()
]

const preference = require("../../preference/prefenceapi")

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     */
    register(client) {
        preference.registerPreference("accept-hugs", "true")
        actions.forEach(action => {
            action.register(client)
        })
    }
}