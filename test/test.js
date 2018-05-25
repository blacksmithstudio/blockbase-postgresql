const should = require('should')

const config = {
    postgresql: {
        user: 'postgres',
        password: 'root',
        host: 'localhost',
        database: 'knex_test',
        port: '5432'
    },
    get(value) {
        return this[value] || null
    },
    has(value) {
        return this[value] || null
    }
}
const app = {
    drivers: {
        logger: console.log
    },
    config
}
const postgresql = require('../driver')(app)

describe('Postgresql Driver', () => {
    describe('Init', () => {
        it('should connect to test DB', async function () {
            let result = await postgresql.execute('SELECT * FROM users LIMIT 2')
            should.exist(result)
            //should.exist(result.rows)
            //should.exist(result.fields)
        })
        describe('Basic queries', () => {

            it('should make a raw select with params', async function () {
                let result = await postgresql.execute('SELECT * FROM users WHERE id > $3 LIMIT $1 OFFSET $2', [2, 0, 1])
                should.exist(result)
                //should.exist(result.rows)
                //should.exist(result.fields)
            })
            it('should make an insert', async function () {
                let item = {
                    params: {type: 'user'},
                    body: () => ({firstname: 'first', lastname: 'last'}),
                    valid: () => true
                }
                let result = await postgresql.save(item)
                should.exist(result)
                delete result.data.id
                should.deepEqual(item.body(), result.data)
            })

            it('should read an item', async function () {
                let item = {
                    params: {type: 'user'},
                    data: {firstname: 'first', lastname: 'last', id: 33},
                    body(value) {
                        if (value)
                            this.data = value
                        return this.data
                    },
                    valid: () => true
                }
                let result = await postgresql.read(item)
                should.exist(result)
                should.deepEqual(item.body(), result.data)
            })

            it('should update an item', async function () {
                let item = {
                    params: {type: 'user'},
                    data: {firstname: 'firstUpdate', lastname: 'lastUpdate', id: 6},
                    body(value) {
                        if (value)
                            this.data = value
                        return this.data
                    },
                    valid: () => true
                }
                let result = await postgresql.update(item)
                should.exist(result)
                should.deepEqual(item.body(), result.data)
            })

            it('should delete an item', async function () {
                let item = {
                    params: {type: 'user'},
                    data: {firstname: 'firstUpdate', lastname: 'lastUpdate', id: 6},
                    body(value) {
                        if (value)
                            this.data = value
                        return this.data
                    },
                    valid: () => true
                }
                let result = await postgresql.delete(item)
                should.exist(result)

            })
        })
    })
})



