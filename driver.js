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
    if(!app.config.has('postgresql'))
        return app.drivers.logger.error('Drivers', 'Can not init postgresql, no valid config')

    const config = app.config.get('postgresql')
    const pool = new pg.Pool({
        user: config.user,
        database: config.database,
        password: config.password,
        host: config.host,
        port: config.port,
        max: 1000,
        idleTimeoutMillis: 30000
    })

    /**
     * Query function, executing the SQL query
     * @private
     * @name query
     * @param {string} sql - sql query (prepared or not)
     * @param {Object[]} data - array of data to pass in the prepared query
     * @param {function} cb - callback
     */
    function query(sql, data, cb){
        pool.connect((err, client, done) => {
            if (err) return app.drivers.logger.error('Drivers - postgresql', err)

            client.query(sql, data, (err, result) => {
                done(err)
                if (err) return cb(err, null)

                cb(null, result.rows)
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
    function prepare(values){
        return _.map(values, (val) => {
            switch(typeof val){
                case 'object':
                    if(Array.isArray(val))
                        val = JSON.stringify(val).replace('[', '{').replace(']', '}')
                    else
                        val = JSON.stringify(val)
                    break
                default:
                    break
            }

            return val
        })
    }

    return {
        /**
         * Execute a custom query
         * @alias query
         */
        execute : query,

        /**
         * Create an object based on a Blocbase valid model
         * @param {Object} item - object compiled by the model
         * @param {function} cb - callback
         */
        create(item, cb){
            let columns = _.keys(item.body())
            let values = _.values(item.body())
            let pseudos = _.map(_.range(1, Object.keys(columns).length+1), (value, key) => { return `$${value}` })
            let q = `INSERT INTO ${item.params.type}s (${columns}) VALUES (${pseudos.join(',')}) RETURNING *`

            query(q, prepare(values), (err, rows) => {
                if(err || !rows.length) return cb(err, null)

                item.data = rows[0]
                cb(null, item)
            })
        },

        /**
         * Read an object from the DB
         * @param {Object} item - object compiled by the model (needs id)
         * @param {function} cb - callback
         */
        read(item, cb){
            if(!item.data || !item.data.id)
                return cb(`Cannot read an item without an 'id'`, null)

            let q = `SELECT * FROM ${item.params.type}s WHERE id=$1`

            query(q, [ item.data.id ], (err, rows) => {
                if(err || !rows.length) return cb(err, null)

                item.body(rows[0])
                cb(null, item)
            })
        },

        /**
         * Update a valid object model
         * @param {Object} item - object compiled by the model
         * @param {function} cb - callback
         */
        update(item, cb){
            if(!item.data || !item.data.id)
                return cb(`Cannot update an item without an 'id'`, null)

            let updates = [],
                count = 1

            for (let [k, v] of Object.entries(item.body())) {
                updates.push(`${k}=$${count}`)
                count++
            }

            let q = `UPDATE ${item.params.type}s SET ${updates.join(',')} WHERE id=$${count} RETURNING *`

            let values = _.values(item.body()).concat([ item.data.id ])

            query(q, prepare(values), (err, rows) => {
                if(err || !rows.length) return cb(err, null)

                item.body(rows[0])
                cb(null, item)
            })
        },

        /**
         * Delete a valid object model
         * @param {Object} item - object compiled by the model
         * @param {function} cb - callback
         */
        delete(item, cb){
            if(!item.data || !item.data.id)
                return cb(`Cannot delete an item without an 'id'`, null)

            let q = `DELETE FROM ${item.params.type}s WHERE id=$1`

            query(q, [ item.data.id ], (err, rows) => {
                if(err)
                    return cb ? cb(err, false) : app.drivers.logger.error('Postgresql', err)

                if(cb)
                    cb(null, true)
            })
        },

        /**
         * Save the object and execute the creation or update
         * @param {Object} item - object compiled by the model
         * @param {function} cb - callback
         */
        save(item, cb){
            if(!item.valid()) return cb(item.validate().error, null)
            this.create(item, cb)
        },

        /**
         * Append a value to a pSQL Array
         * @param {string} item - user item
         * @param {number} target - target id
         * @param {string} column - target column (array)
         * @param {*} value - value to insert
         * @param {function} cb - callback
         */
        array_append(item, target, column, value, cb){
            let q = `UPDATE ${item.params.type}s SET ${column}=array_append(${column}, $1) where id=$2 and $1 <> all (${column}) RETURNING *`

            query(q, [ value, target ], (err, rows) => {
                if(err || !rows.length) return cb(err, null)

                item.body(rows[0])
                cb(null, item)
            })
        },

        /**
         * Remove a value from a pSQL Array
         * @param {string} item - user item
         * @param {number} target - target id
         * @param {string} column - target column (array)
         * @param {*} value - value to insert
         * @param {function} cb - callback
         */
        array_remove(item, target, column, value, cb){
            let q = `UPDATE ${item.params.type}s SET ${column}=array_remove(${column}, $1) where id=$2 RETURNING *`

            query(q, [ value, target ], (err, rows) => {
                if(err || !rows.length) return cb(err, null)

                item.body(rows[0])
                cb(null, item)
            })
        }
    }
}
