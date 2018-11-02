const _ = require('underscore')
const pg = require('pg')

/**
 * Blockbase Postgresql driver (app.drivers.postgresql)
 * @memberof app.drivers
 * @author Alexandre Pereira <alex@blacksmith.studio>
 * @param {Object} app - Application namespace
 *
 * @returns {Object} driver object containing public methods
 */
module.exports = (app) => {
    const Logger = app.drivers.logger

    if (!app.config.has('postgresql'))
        return Logger.error('Drivers', 'Can not init postgresql, no valid config')

    const config = app.config.get('postgresql')
    config.max = config.max || 1000
    config.idleTimeoutMillis = config.idleTimeoutMillis || 30000

    const pool = new pg.Pool(config)

    /**
     * Query function, executing the SQL query
     * @private
     * @name query
     * @param {string} sql - sql query (prepared or not)
     * @param {Object[]} data - array of data to pass in the prepared query
     * @param {function} cb - callback
     */
    async function query(sql, data) {
        return new Promise((resolve, reject) => {
            pool.connect((error, client, done) => {
                if (error) {
                    Logger.error('Drivers - postgresql', error)
                    return reject(error)
                }

                client.query(sql, data, (error, result) => {
                    done(error)
                    if (error) return reject(error)

                    resolve(result.rows)
                })
            })
        })
    }

    /**
     * Preparation of the values (transformation)
     * @private
     * @param {Object[]} values - array of data to prepare
     *
     * @returns {Object[]} array of transformed data
     */
    function prepare(values) {
        return values.map(val => {
            if (typeof val == 'object') {
                if (Array.isArray(val))
                    return JSON.stringify(val).replace('[', '{').replace(']', '}')
                else
                    return JSON.stringify(val)
            }
            else
                return val
        })
    }

    return {
        /**
         * Execute a custom query
         * @alias query
         */
        execute: query,

        /**
         * Create an object based on a Blocbase valid model
         * @param {Object} item - object compiled by the model
         * @return {Object} saved item
         */
        async save(item) {
            if (!item.valid()) throw Error(item.validate().error)

            try {
                let columns = Object.keys(item.body()).map(c => `"${c}"`),
                    values  = Object.values(item.body())

                let pseudos = _.map(_.range(1, Object.keys(columns).length + 1), (value, key) => {
                    return `$${value}`
                })
                let q = `INSERT INTO ${item.params.table || (item.params.type + 's')} (${columns}) VALUES (${pseudos.join(',')}) RETURNING *`

                let rows = await query(q, prepare(values))
                item.data = rows[0]
                return item
            } catch (e) {
                throw e
            }
        },

        /**
         * Read an object from the DB
         * @param {Object} item - object compiled by the model (needs id)
         * @return {Object} called item
         */
        async read(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot read an item without an 'id'`)

            let q = `SELECT * FROM ${item.params.table || (item.params.type + 's')} WHERE id=$1`

            try {

                let rows = await query(q, [item.data.id])
                if (rows.length)
                    item.body(rows[0])
                return rows.length ? item : null

            } catch (e) {
                throw e
            }
        },

        /**
         * Update a valid object model
         * @param {Object} item - object compiled by the model
         * @return {Object} updated item
         */
        async update(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot update an item without an 'id'`)

            let updates = [],
                count   = 1

            for (let [k, v] of Object.entries(item.body())) {
                updates.push(`"${k}"=$${count}`)
                count++
            }

            let q = `UPDATE ${item.params.table || (item.params.type + 's')} SET ${updates.join(',')} WHERE id=$${count} RETURNING *`

            let values = _.values(item.body()).concat([item.data.id])

            try {
                let rows = await query(q, prepare(values))
                item.body(rows[0])
                return item
            } catch (e) {
                throw e
            }
        },

        /**
         * Delete a valid object model
         * @param {Object} item - object compiled by the model
         * @returns {boolean} - true if deleted
         */
        async delete(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot delete an item without an 'id'`)

            let q = `DELETE FROM ${item.params.table || (item.params.type + 's')} WHERE id=$1`

            try {
                let done = await query(q, [item.data.id])
                return true
            } catch (e) {
                throw e
            }
        },

        /**
         * Append a value to a pSQL Array
         * @param {string} item - user item
         * @param {number} target - target id
         * @param {string} column - target column (array)
         * @param {*} value - value to insert
         * @returns {Object} - updated item
         */
        async array_append(item, target, column, value) {
            let q = `UPDATE ${item.params.table || (item.params.type + 's')} SET ${column}=array_append(${column}, $1) where id=$2 and $1 <> all (${column}) RETURNING *`

            try {
                let rows = await query(q, [value, target])
                item.body(rows[0])
                return item
            } catch (e) {
                throw e
            }
        },

        /**
         * Remove a value from a pSQL Array
         * @param {string} item - user item
         * @param {number} target - target id
         * @param {string} column - target column (array)
         * @param {*} value - value to insert
         * @returns {Object} - updated item
         */
        async array_remove(item, target, column, value) {
            let q = `UPDATE ${item.params.table || (item.params.type + 's')} SET ${column}=array_remove(${column}, $1) where id=$2 RETURNING *`

            try {
                let rows = await query(q, [value, target])
                item.body(rows[0])
                return item
            } catch (e) {
                throw e
            }
        }
    }
}
