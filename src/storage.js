const mysql = require("mysql")
const config = require("./config/config.js");

const DATABASE_NAME = "hug_stats"

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${DATABASE_NAME} ` +
  "(guildId BIGINT NOT NULL, userId BIGINT NOT NULL, hugsSent BIGINT NOT NULL, hugsReceived BIGINT NOT NULL, PRIMARY KEY(guildId, userId));"
const GET_HUG_STATS = `SELECT hugsSent, hugsReceived FROM ${DATABASE_NAME} WHERE guildId = ? AND userId = ?`
const UPDATE_OR_CREATE = `INSERT INTO ${DATABASE_NAME} (guildId, userId, hugsSent, hugsReceived) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE hugsSent = VALUES(hugsSent), hugsReceived = VALUES(hugsReceived)`
const INCREMENT_STATISTIC = (statistic) => `UPDATE ${DATABASE_NAME} SET ${statistic} = ${statistic} + 1 WHERE guildId = ? AND userId = ?`

module.exports = {
  async load() {
    const storage = this;
    return new Promise((resolve, reject) => {
      storage.db = mysql.createPool({
        connectionLimit: 10,
        host: config.mysql.host,
        user: config.mysql.username,
        password: config.mysql.password,
        database: config.mysql.database,
        port: config.mysql.port
      });
      storage.db.query(CREATE_TABLE, [], (err, results) => {
        if (err) return console.log(err)
      })

      resolve(this)
    });
  },
  async _incrementStatistic(statistic, guildId, userId) {
    const user = await this.getUserInfoOrCreate(guildId, userId)

    return new Promise((resolve, reject) => {
      this.db.query(INCREMENT_STATISTIC(statistic), [guildId, userId], (err, results) => {
        if (err) resolve(false)
        else resolve(true)
      })
    })

  },
  async incrementHugsSent(guildId, userId) {
    await this._incrementStatistic("hugsSent", guildId, userId)
  },
  async incrementHugsReceived(guildId, userId) {
    await this._incrementStatistic("hugsReceived", guildId, userId)
  },
  async logHugEvent(guildId, huggerId, huggedId) {
    guildId = parseInt(guildId)
    huggerId = parseInt(huggerId)
    huggedId = parseInt(huggedId)

    await this.incrementHugsReceived(guildId, huggedId);
    await this.incrementHugsSent(guildId, huggerId);

  },
  async getUserInfo(guildId, userId) {
    guildId = parseInt(guildId)
    userId = parseInt(userId)

    return new Promise((resolve, reject) => {
      this.db.query(GET_HUG_STATS, [guildId, userId], (err, results) => {
        if (err) return reject(err)
        if (results.length == 0) return resolve()
        const row = results[0]

        const user = this.createDefaultUser()
        user.hugsSent = row.hugsSent
        user.hugsReceived = row.hugsReceived

        resolve(user)
      })
    })
  },
  // non-sql
  createDefaultUser() {
    return {
      hugsSent: 0,
      hugsReceived: 0
    };
  },
  async getUserInfoOrCreate(guildId, userId) {
    guildId = parseInt(guildId)
    userId = parseInt(userId)

    const existingUser = await this.getUserInfo(guildId, userId)
    if (!existingUser)
      return new Promise((resolve, reject) => {
        this.db.query(UPDATE_OR_CREATE, [guildId, userId, 0, 0], (err) => {
          if (err) {
            console.log("error creating new: " + err)
            return reject(err)
          }
          resolve(this.createDefaultUser())
        })
      })
    return existingUser
  },
  async getTotalHugsSent(guildId, userId) {
    guildId = parseInt(guildId)
    userId = parseInt(userId)

    const userInfo = await this.getUserInfo(guildId, userId);
    if (userInfo) return userInfo.hugsSent
    return 0
  },
  async getTotalHugsReceived(guildId, userId) {
    guildId = parseInt(guildId)
    userId = parseInt(userId)

    const userInfo = await this.getUserInfo(guildId, userId)
    if (userInfo) return userInfo.hugsReceived
    return 0
  }
}

