/**
 * Blockbase test file
 * @author Blacksmith <code@blacksmith.studio>
 */
const should = require('should')
process.env['NODE_CONFIG_DIR'] = __dirname + '/config'

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason)
    // application specific logging, throwing an error, or other logic here
})

const blockbase = require('blockbase')

let driver
let application

blockbase({ root: __dirname }, async app => {
    driver = app.drivers.postgresql = require('../driver')(app)
    application = app
})

describe('Postgresql driver tests', async function () {
    describe('Initialization', function () {
        it('should initialize the app', async function () {
            should.exist(application)
        })
    })

    describe('Architecture', function () {
        it('should have models', function () {
            should.exist(application.models)
            should.exist(application.models.user)
        })
    })

    describe('Methods', function () {
        let id
        let firstname   = 'toto',
            lastname    = 'robert',
            favorites   = { a: [1, 34, { 'a': 2 }] },
            preferences = [1, 2, 3],
            order       = 1
        let _tests = 100
        it('should save a user', async function () {

            const User = application.models.user
            const UserModel = new User({ firstname, lastname, favorites, order, preferences })
            try {
                let user = await UserModel.save()
                should.exist(user)
                should.exist(user.data)
                should.exist(user.data.firstname)
                should.exist(user.data.id)
                should.equal(user.data.firstname, firstname)
                should.exist(user.data.favorites)
                should.equal(JSON.stringify(user.data.favorites), JSON.stringify(favorites))
                should.exist(user.data.order)
                should.equal(user.data.order, order)
                should.exist(user.data.preferences)
                should.equal(JSON.stringify(user.data.preferences), JSON.stringify(preferences))
                id = user.data.id
            } catch (e) {
                console.log('e', e)

                should.not.exist(e)
            }
        })

        it('should read many user', async function () {
            this.timeout(10000)

            const User = application.models.user
            const UserModel = new User({ id })
            for (let i = 0; i < _tests; i++) {
                let existing = await UserModel.read()
            }

            try {
                let existing = await UserModel.read()
                should.exist(existing)
                should.exist(existing.data)
                should.exist(existing.data.id)
                should.exist(existing.data.firstname)
                should.equal(existing.data.firstname, firstname)
                should.exist(existing.data.favorites)
                should.equal(JSON.stringify(existing.data.favorites), JSON.stringify(favorites))
                should.exist(existing.data.order)
                should.equal(existing.data.order, order)
                should.exist(existing.data.preferences)
                should.equal(JSON.stringify(existing.data.preferences), JSON.stringify(preferences))
            } catch (e) {
                should.not.exist(e)
            }
        })

        for (let i = 0; i < 1000; i++) {

            it(`should read a user [${i}]`, async function () {

                const User = application.models.user
                const UserModel = new User({ id })

                try {
                    let existing = await UserModel.read()
                    should.exist(existing)
                    should.exist(existing.data)
                    should.exist(existing.data.id)
                    should.exist(existing.data.firstname)
                    should.equal(existing.data.firstname, firstname)
                    should.exist(existing.data.favorites)
                    should.equal(JSON.stringify(existing.data.favorites), JSON.stringify(favorites))
                    should.exist(existing.data.order)
                    should.equal(existing.data.order, order)
                    should.exist(existing.data.preferences)
                    should.equal(JSON.stringify(existing.data.preferences), JSON.stringify(preferences))
                } catch (e) {
                    should.not.exist(e)
                }
            })
        }


        it('should update a user', async function () {

            let firstname = 'toto2', lastname = 'robert2', favorites = [{ a: 1, b: 2, c: { a: 2 } }, { d: '4', e: 4 }]
            const User = application.models.user

            const UserModel = new User({ id, firstname, lastname, favorites })

            try {
                let existing = await UserModel.update()
                should.exist(existing)
                should.exist(existing.data)
                should.exist(existing.data.id)
                should.exist(existing.data.firstname)
                should.exist(existing.data.lastname)
                should.exist(existing.data.order)
                should.equal(existing.data.firstname, firstname)
                should.equal(existing.data.lastname, lastname)
                should.exist(existing.data.favorites)
                should.equal(JSON.stringify(existing.data.favorites), JSON.stringify(favorites))
                should.exist(existing.data.order)
                should.equal(existing.data.order, order)
                should.exist(existing.data.preferences)
                should.equal(JSON.stringify(existing.data.preferences), JSON.stringify(preferences))
            } catch (e) {
                should.not.exist(e)
            }
        })


        it.skip('should delete a user', async function () {

            let firstname = 'toto2', lastname = 'robert2'
            const User = application.models.user

            const UserModel = new User({ id, firstname, lastname })

            try {
                let done = await UserModel.delete()
                should.exist(done)
                should.equal(done, true)
            } catch (e) {
                should.not.exist(e)
            }
        })
    })
})
