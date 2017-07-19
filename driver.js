const pg = require('pg')

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

    return {
        create(item, cb){
            console.log('psql create')
        },

        read(item, options, cb){
            console.log('psql read')
        },

        update(item, data, cb){
            console.log('psql update')
        },

        delete(item, cb){
            console.log('psql delete')
        },

        save(item, cb){
            console.log('psql save')
        }
    }
}
