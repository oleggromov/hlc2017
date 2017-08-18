const express = require('express')
const app = express()

const path = require('path')
const loadJsons = require('./load-jsons')

console.time('load_data_time')
const db = loadJsons(path.resolve(__dirname, './data'))
console.timeEnd('load_data_time')

console.log('Loaded:')
console.log(`${db.users.length} users`)
console.log(`${db.locations.length} locations`)
console.log(`${db.visits.length} visits`)

// app.get('/', function (req, res) {
//   res.send('Hello World!')
// })

// app.listen(3000, function () {
//   console.log('Example app listening on port 80!')
// })
