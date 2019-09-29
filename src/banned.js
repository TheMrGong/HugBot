const banned = [
    "246816877865598976",
    "194524995844571136",
    "267919588300161024",
    "370286246754516992"
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