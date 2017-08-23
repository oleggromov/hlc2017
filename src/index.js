const DEBUG = process.env.NODE_ENV !== 'production'
if (DEBUG) {
  console.warn('Running in DEBUG mode')
} else {
  console.log('NODE_ENV === production')
}

const path = require('path')
const loadJsons = require('./load-jsons')

const DATA_DIR = './data'
// const DATA_DIR = './data_train'

console.time('load_data_time')
const db = loadJsons(path.resolve(__dirname, DATA_DIR))
console.timeEnd('load_data_time')

console.log('Loaded:')
console.log(`${db.getCollection('users').count()} users`)
console.log(`${db.getCollection('locations').count()} locations`)
console.log(`${db.getCollection('visits').count()} visits`)

const http = require('http')
const resMethods = require('./res-methods')

const server = http.createServer()

const getVisits = {
  url: /\/users\/(\d+)\/visits/,
  handler: require('./get-visits')(DEBUG, db)
}

const timestamp = db.getCollection('timestamp').find()[0].timestamp
const getAvg = {
  url: /\/locations\/(\d+)\/avg/,
  handler: require('./get-avg')(DEBUG, db, timestamp)
}

const getCollection = {
  url: /\/(users|visits|locations)\/(\d+|bad)/,
  handler: require('./get-collection')(DEBUG, db)
}

server.on('request', (req, res) => {
  const { method, url } = req

  if (method === 'GET') {
    let match

    if (match = url.match(getVisits.url)) {
      handler = getVisits.handler
    } else if (match = url.match(getAvg.url)) {
      handler = getAvg.handler
    } else if (match = url.match(getCollection.url)) {
      handler = getCollection.handler
    } else {
      return resMethods.sendBadRequest(req, res)
    }

    return handler(match, req, res)
  } else if (method === 'POST') {
    return resMethods.sendBadRequest(req, res)
  }
})

// app.get('/:collection/:id', require('./get-collection')(DEBUG, db))
// app.get('/users/:id/visits', require('./get-visits')(DEBUG, db))
// app.get('/locations/:id/avg', require('./get-avg')(DEBUG, db, db.getCollection('timestamp').find()[0].timestamp))

// app.post('/:collection/new', bodyParser.json(), require('./post-collection')(DEBUG, db))
// app.post('/:collection/:id', bodyParser.json(), require('./post-collection-update')(DEBUG, db))

let port = 80
if (process.argv.length === 3) {
  port = Number(process.argv[2])
}

server.listen(port, function () {
  console.log(`Listening on port ${port}!`)
})
