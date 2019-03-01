console.log("Loading storage...");
const sqlite3 = require("sqlite3");
console.log("Sql required.");
const hugStore = {};

module.exports = {
  async load() {
    const storage = this;
    console.log("Running load...");
    return new Promise((resolve, reject) => {
      console.log("Defining DB");
      storage.db = new sqlite3.Database(":memory:", err => {
        if (err) {
          console.error(err.message);
          return reject(err.message);
        }
        console.log("Connected to the in-memory SQlite database.");
        storage.db.run(
          "CREATE TABLE IF NOT EXISTS hug_stats " +
            "(guildId BIGINT NOT NULL, userId BIGINT NOT NULL, hugsSent BIGINT NOT NULL, hugsReceived BIGINT NOT NULL, PRIMARY KEY(guildId, userId));",
          [],
          err => {
            console.log("got error: " + err);
          }
        );
        resolve(true);
      });
    });
  },
  incrementHugsSent(guildId, userId) {
    this.getUserInfoOrCreate(guildId, userId).hugsSent++;
  },
  incrementHugsReceived(guildId, userId) {
    this.getUserInfoOrCreate(guildId, userId).hugsReceived++;
  },
  logHugEvent(guildId, huggerId, huggedId) {
    this.incrementHugsReceived(guildId, huggedId);
    this.incrementHugsSent(guildId, huggerId);
  },
  getUserInfo(guildId, userId) {
    const guildStorage = hugStore[guildId];
    if (guildStorage) return guildStorage[userId];
  },
  // non-sql
  createDefaultUser() {
    return {
      hugsSent: 0,
      hugsReceived: 0
    };
  },
  getUserInfoOrCreate(guildId, userId) {
    let guildStorage = hugStore[guildId];
    if (!guildStorage) {
      guildStorage = {};
      hugStore[guildId] = guildStorage;
    }

    let userInfo = guildStorage[userId];
    if (!userInfo) {
      userInfo = this.createDefaultUser();
      guildStorage[userId] = userInfo;
    }

    return userInfo;
  },
  async getTotalHugsSent(guildId, userId) {
    return new Promise((resolve, reject) => {
      const userInfo = this.getUserInfo(guildId, userId);
      if (userInfo) return resolve(userInfo.hugsSent);
      resolve(0);
    });
  },
  async getTotalHugsReceived(guildId, userId) {
    return new Promise((resolve, reject) => {
      const userInfo = this.getUserInfo(guildId, userId);
      if (userInfo) return resolve(userInfo.hugsReceived);
      resolve(0);
    });
  }
};
