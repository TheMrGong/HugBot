//@ts-check

const Discord = require("discord.js")

const { HugActionBuilder, HugActions } = require("./hugaction")

const actions = [
    new HugActionBuilder(HugActions.GLOMP).detect("single").emoji("562080200633090052").build(),
    new HugActionBuilder(HugActions.POKE).detect("single").emoji("562451954001772552").build(),
    new HugActionBuilder(HugActions.HUG).detect("single").emoji("537999431266467870").build()
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