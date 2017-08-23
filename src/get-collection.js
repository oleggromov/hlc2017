const resMethods = require('./res-methods')
const stripLokiMeta = require('./strip-loki-meta')
const log = require('./log')

const getParams = (match) => {
  const collection = match[1]
  const id = Number(match[2])

  return {
    collection,
    id
  }
}

module.exports = function (DEBUG, db) {
  return (match, req, res) => {
    log.time(DEBUG, 'get_collection')

    log.time(DEBUG, '    get_collection_parseUrl')
    const { collection, id } = getParams(match)
    log.timeEnd(DEBUG, '    get_collection_parseUrl')

    if (isNaN(id)) {
      log.time(DEBUG, '    get_collection_send_notFound')
      resMethods.sendNotFound(req, res)
      log.timeEnd(DEBUG, '    get_collection_send_notFound')
      return
    }

    log.time(DEBUG, '    get_collection_getCollection')
    const result = db.getCollection(collection).find({ id })
    log.timeEnd(DEBUG, '    get_collection_getCollection')

    log.time(DEBUG, '    get_collection_send')
    if (result.length) {
      resMethods.sendResult(stripLokiMeta(result[0]), req, res)
    } else {
      resMethods.sendNotFound(req, res)
    }
    log.timeEnd(DEBUG, '    get_collection_send')

    log.timeEnd(DEBUG, 'get_collection')
  }
}
