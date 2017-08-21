const path = require('path')
const fs = require('fs')
const loki = require('lokijs')

const basedir = __dirname + '/data/'

function getDataFiles (dir) {
  const isDataFile = (filename) => {
    return fs.lstatSync(path.resolve(basedir, filename)).isFile() && /\w+_\d+\.json/.test(filename)
  }

  return fs
    .readdirSync(dir)
    .filter(isDataFile)
}

function loadJsons (dir) {
  const db = new loki('hlc')
  const files = getDataFiles(dir)

  // TODO add indexes
  const collections = {
    users: db.addCollection('users'),
    locations: db.addCollection('locations'),
    visits: db.addCollection('visits'),
    timestamp: db.addCollection('timestamp')
  }

  const str = fs.readFileSync(path.resolve(basedir, 'options.txt'), 'utf8')
  if (str) {
    let timestamp = str.match(/(\d+)\n/)
    if (timestamp) {
      db.getCollection('timestamp').insert({ timestamp: Number(timestamp[1]) })
      console.log(`Found timestamp ${db.getCollection('timestamp').find()[0].timestamp}`)
    }
  }

  console.time('read and insert data')
  files.forEach(filename => {
    const type = filename.match(/(\w+?)_/)[1]
    const parsed = JSON.parse(fs.readFileSync(path.resolve(basedir, filename), 'utf8'))

    if (parsed[type] && Array.isArray(parsed[type])) {
      collections[type].insert(parsed[type])
    }
  })

  console.timeEnd('read and insert data')

  console.time('build indexes')
  collections['users'].ensureIndex('id', true)
  collections['locations'].ensureIndex('id', true)
  collections['locations'].ensureIndex('country', true)
  collections['locations'].ensureIndex('distance', true)
  collections['visits'].ensureIndex('id', true)
  collections['visits'].ensureIndex('visited_at', true)
  console.timeEnd('build indexes')

  return db
}

module.exports = loadJsons
