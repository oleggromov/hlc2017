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
    users: db.addCollection('users', {
      unique: ['id']
    }),
    locations: db.addCollection('locations', {
      unique: ['id']
    }),
    visits: db.addCollection('visits', {
      unique: ['id'],
      indices: ['visited_at']
    })
  }

  files.forEach(filename => {
    const type = filename.match(/(\w+?)_/)[1]
    const parsed = JSON.parse(fs.readFileSync(path.resolve(basedir, filename), 'utf8'))

    if (parsed[type] && Array.isArray(parsed[type])) {
      collections[type].insert(parsed[type])
    }
  })

  return db
}

module.exports = loadJsons
