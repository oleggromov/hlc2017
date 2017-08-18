const path = require('path')
const fs = require('fs')
// const loki = require('lokijs')

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
  let data = {}
  const files = getDataFiles(dir)

  files.forEach(filename => {
    const type = filename.match(/(\w+?)_/)[1]
    if (!data[type]) {
      data[type] = []
    }

    const text = fs.readFileSync(path.resolve(basedir, filename), 'utf8')
    const parsed = JSON.parse(text)

    if (parsed[type] && Array.isArray(parsed[type])) {
      data[type] = data[type].concat(parsed[type])
    }
  })

  return data
}

module.exports = loadJsons
