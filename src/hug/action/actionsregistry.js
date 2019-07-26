//@ts-check

const Discord = require("discord.js")

const { HugActionBuilder, HugActions } = require("./hugaction")

const actions = [
    new HugActionBuilder(HugActions.GLOMP).detect("single").emoji("562080200633090052").build(),
    new HugActionBuilder(HugActions.POKE).detect("single").emoji("562451954001772552").build()
]

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     */
    register(client) {
        actions.forEach(action => {
            action.register(client)
        })
    }
}