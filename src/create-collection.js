const postParamsAreValid = require('./post-params-are-valid')
const log = require('./log')
const resMethods = require('./res-methods')

const getCollection = (match) => {
  return match[1]
}

module.exports = function (DEBUG, db) {
  return function (match, data, req, res) {
    log.time(DEBUG, 'post_collection')
    log.log(DEBUG, match.input, JSON.stringify(data))

    const collection = getCollection(match)

    log.time(DEBUG, '    post_collection_ifExists')
    if (db.getCollection(collection).find({ id: data.id }).length) {
      resMethods.sendBadRequest(req, res)
      return
    }
    log.timeEnd(DEBUG, '    post_collection_ifExists')

    log.time(DEBUG, '    post_collection_validate')
    if (!postParamsAreValid(collection, data)) {
      resMethods.sendBadRequest(req, res)
      return
    }
    log.timeEnd(DEBUG, '    post_collection_validate')

    log.time(DEBUG, '    post_collection_insert')
    let result = db.getCollection(collection).insert(data)
    log.timeEnd(DEBUG, '    post_collection_insert')

    log.time(DEBUG, '    post_collection_result')
    resMethods.sendResult({}, req, res)
    log.timeEnd(DEBUG, '    post_collection_result')

    log.timeEnd(DEBUG, 'post_collection')
  }
}
