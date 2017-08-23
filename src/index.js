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
const parseBody = require('./parse-body')

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
  url: /\/(users|visits|locations)\/(\d+|\w+)/,
  handler: require('./get-collection')(DEBUG, db)
}

const createCollection = {
  url: /\/(users|visits|locations)\/new/,
  handler: require('./create-collection')(DEBUG, db)
}

const updateCollection = {
  url: /\/(users|visits|locations)\/(\d+)/,
  handler: require('./update-collection')(DEBUG, db)
}

server.on('request', (req, res) => {
  const { method, url } = req
  let match

  if (method === 'GET') {
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
  }

  if (method === 'POST') {
    parseBody(req, reqData => {
      if (match = url.match(createCollection.url)) {
        handler = createCollection.handler
      } else if (match = url.match(updateCollection.url)) {
        handler = updateCollection.handler
      } else {
        return resMethods.sendBadRequest(req, res)
      }

      return handler(match, reqData, req, res)
    }, () => {
      return resMethods.sendBadRequest(req, res)
    })
  }
})

let port = 80
if (process.argv.length === 3) {
  port = Number(process.argv[2])
}

server.listen(port, function () {
  console.log(`Listening on port ${port}!`)
})
