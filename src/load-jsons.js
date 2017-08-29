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

function loadJsons (dir, callback) {
  const db = new loki('hlc')
  let files = getDataFiles(dir)
  let totalSize = 0

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
      console.log(`Timestamp: ${db.getCollection('timestamp').find()[0].timestamp}`)
    }
  }

  console.log(`${files.length} data files is found`)
  console.time('read and insert data')

  const buildIndexes = () => {
    console.time('build indexes')
    collections['users'].ensureIndex('id', true)
    collections['users'].ensureIndex('birth_date', true)
    collections['users'].ensureIndex('gender', true)
    collections['locations'].ensureIndex('id', true)
    collections['locations'].ensureIndex('country', true)
    collections['locations'].ensureIndex('distance', true)
    collections['visits'].ensureIndex('id', true)
    collections['visits'].ensureIndex('user', true)
    collections['visits'].ensureIndex('location', true)
    collections['visits'].ensureIndex('visited_at', true)
    console.timeEnd('build indexes')
  }

  const getSize = (bytes) => {
    const mb = Math.round(bytes / 1048576)
    const kb = Math.round(bytes / 1024)

    if (kb < 1) {
      return `${bytes} bytes`
    } else if (mb < 1) {
      return `${kb} Kb`
    }

    return `${mb} Mb`
  }

  const processStreamed = (filename, callback, next) => {
    const type = filename.match(/(\w+?)_/)[1]
    const filepath = path.resolve(basedir, filename)
    const readable = fs.createReadStream(filepath, { encoding: 'utf8' })

    let buffer = []
    readable.on('data', chunk => {
      buffer.push(chunk)
    })

    readable.on('end', () => {
      totalSize += readable.bytesRead
      console.log(`${filename} -> ${type}, ${getSize(readable.bytesRead)}`)
      const parsed = JSON.parse(buffer.join(''))
      callback(type, parsed)
      next()
    })
  }

  const importData = (type, data) => {
    if (data[type] && Array.isArray(data[type])) {
      collections[type].insert(data[type])
    }
  }

  return new Promise((resolve, reject) => {
    const processNext = () => {
      if (files.length) {
        processStreamed(files.pop(), importData, processNext)
      } else {
        console.timeEnd('read and insert data')
        console.log(`Total size: ${getSize(totalSize)}`)
        buildIndexes()
        resolve(db)
      }
    }

    processStreamed(files.pop(), importData, processNext)
  })
}

module.exports = loadJsons
