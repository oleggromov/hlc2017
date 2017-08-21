const express = require('express')
const app = express()

const path = require('path')
const loadJsons = require('./load-jsons')

console.time('load_data_time')
const db = loadJsons(path.resolve(__dirname, './data'))
console.timeEnd('load_data_time')

console.log('Loaded:')
console.log(`${db.getCollection('users').count()} users`)
console.log(`${db.getCollection('locations').count()} locations`)
console.log(`${db.getCollection('visits').count()} visits`)

app.get('/:collection/:id', require('./get-collection')(db))
app.get('/users/:id/visits', require('./get-visits')(db))
app.get('/locations/:id/avg', require('./get-avg')(db, db.getCollection('timestamp').find()[0].timestamp))

let port = 80
if (process.argv.length === 3) {
  port = Number(process.argv[2])
}

app.listen(port, function () {
  console.log(`Listening on port ${port}!`)
})
