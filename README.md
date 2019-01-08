# Driver Postgresql for Blockbase
Compatible with Blockbase Framework

[![Travis Blockbase](https://api.travis-ci.org/blacksmithstudio/blockbase-postgresql.svg?branch=master)](https://travis-ci.org/blacksmithstudio/blockbase-postgresql)

### Version
v1.0.9

### How to install ?
```shell
$ npm i --save blockbase-postgresql
```

Then add to your config/{env}.yml the following instructions depending of your system
```yml
dbms : postgresql
postgresql :
    host : localhost
    user : johndoe
    password :
    port : 5432
    database : yourdatabase
```

Postgresql driver also supports [npm pg](https://www.npmjs.com/package/pg) options, and implements **connection Pooling**

### How to use ?

When you configure mysql as your dbms, Blockbase automatically binds the driver to the models with the basic methods. Such as **read/save/update/delete etc.**

##### Basic usage

```js
//myController.js
module.exports = (app) => {
    cont Logger = app.drivers.logger
    const User = app.models.user

    return {
        async foo(req, res){

            let user = new User({id: 25})
            try {
              user = await user.read()

              //do stuff..

              res.send(user.expose('public'))
            catch (e) {
                Logger.error('foo', e)
                res.status(500).send({error :e})
            }
        }
    }
}
```


##### Standalone

The driver can be called inside your controller/models etc..

```js
const mysql = app.drivers.mysql

let q = `SELECT * FROM users`
try {
  let result = await mysql.execute(q, [])
...
```


##### Within a controller :

```js
//myController.js
module.exports = (app) => {
    const mysql = app.drivers.mysql

    return {
        async foo(req, res){
            //Do something with mysql
    ...
```

##### Within a model :


```js
//myModel.js
module.exports = (app) => {
    const Model = app.model._model

    return class MyModel extends Model {
        constructor(data){
            super({type: 'user'})
            if(data) this.data = data
        }

        async foo(bar){
            let q = `SELECT * FROM ${this.params.type}`

            try {
                //this.client is binded to mysql
                return await this.client.execute(q, [])
            }
            catch(e) {
                throw e
            }
        }
    }
}
```

#### Methods

Blockbase-mysql driver implements the following methods :
* read   : read data from a Blockbase model that has an id
* save   : insert data based on a Blockbase model with model validation
* update : update data based on a Blockbase model
* delete : delete an item
* execute: execute a raw query



#### Run tests
Blockbase has some unit tests (with [Mocha](https://mochajs.org)) written run them often !

```sh
$ npm test
```

License
----
(Licence [MIT](https://github.com/blacksmithstudio/blockbase-express/blob/master/LICENCE))
Coded by [Blacksmith](https://www.blacksmith.studio)


**Free Software, Hell Yeah!**

[Node.js]:https://nodejs.org/en
[NPM]:https://www.npmjs.com
