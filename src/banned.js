const banned = [
    "572603417432817685"
]

const dontUnban = [
    "650416358558924803",
    "604260266305257475",
    "292842061814562817",
    "249315989521432576"
]

const client = () => require("./bot").client

module.exports = function (id) {
    const found = banned.includes(id)
    if (found) {
        client().fetchUser(id).then(user => {
            console.log("Banned user " + user.username + "[" + user.id + "] tried to use bot.")
        })
    }
    return found
}