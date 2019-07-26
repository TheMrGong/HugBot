//@ts-check

/**
 * @param {import("mysql").Pool} db
 * @returns {function(string, array): Promise<any>}
 */
module.exports = function (db) {
    /**
     * @param {string} sql
     * @param {array} params
     */
    return (sql, params) => {

        return new Promise((resolve, reject) => db.query(sql, params, (err, results) => {
            if (err) reject(err)
            else resolve(results)
        }))
    }
}
