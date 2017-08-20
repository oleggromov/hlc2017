const path = require('path')
const fs = require('fs')
const alasql = require('alasql')
const insertQueries = require('./inserts')

const basedir = __dirname + '/data/'


function getDataFiles (dir) {
  const isDataFile = (filename) => {
    return fs.lstatSync(path.resolve(basedir, filename)).isFile() && /\w+_\d+\.json/.test(filename)
  }

  return fs
    .readdirSync(dir)
    .filter(isDataFile)
}

function createTables () {
  alasql(`CREATE TABLE users (
    id INT PRIMARY KEY,
    email CHAR(100),
    first_name CHAR(50),
    last_name CHAR(50),
    gender CHAR(1),
    birth_date INT
  )`)

  alasql(`CREATE TABLE locations (
    id INT PRIMARY KEY,
    place TEXT,
    country CHAR(50),
    city CHAR(50),
    distance INT
  )`)

  // TODO Foreign keys don't work for some reason, maybe data inconsistency.
  // And maybe I don't need them
  alasql(`CREATE TABLE visits (
    id INT PRIMARY KEY,
    location INT,
    user INT,
    visited_at INT,
    mark INT
  )`)
}

function loadJsons (dir) {
  const files = getDataFiles(dir)

  createTables()

  const inserts = {
    users: alasql.compile(insertQueries.users),
    locations: alasql.compile(insertQueries.locations),
    visits: alasql.compile(insertQueries.visits)
  }

  files.forEach(filename => {
    const type = filename.match(/(\w+?)_/)[1]
    const parsed = JSON.parse(fs.readFileSync(path.resolve(basedir, filename), 'utf8'))

    if (parsed[type] && Array.isArray(parsed[type])) {
      parsed[type].forEach(user => inserts[type](user))
    }
  })

  return alasql
}

module.exports = loadJsons
