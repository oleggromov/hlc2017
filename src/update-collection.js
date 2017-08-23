const postParamsAreValid = require('./post-params-are-valid')
const log = require('./log')
const resMethods = require('./res-methods')

const getParams = (match) => {
  return {
    collectionName: match[1],
    id: Number(match[2])
  }
}

module.exports = function (DEBUG, db) {
  return function (match, data, req, res) {
    log.time(DEBUG, 'update_collection')
    log.log(DEBUG, match.input, JSON.stringify(data))

    const { collectionName, id } = getParams(match)
    const collection = db.getCollection(collectionName)

    log.time(DEBUG, '    update_collection_exists')
    let source = collection.findOne({ id })

    if (!source) {
      resMethods.sendNotFound(req, res)
      return
    }
    log.timeEnd(DEBUG, '    update_collection_exists')

    log.time(DEBUG, '    update_collection_validate')
    if (!postParamsAreValid(collectionName, data)) {
      resMethods.sendBadRequest(req, res)
      return
    }
    log.timeEnd(DEBUG, '    update_collection_validate')

    log.time(DEBUG, '    update_collection_changeProps')
    Object.assign(source, data)
    collection.update(source)
    log.timeEnd(DEBUG, '    update_collection_changeProps')

    log.time(DEBUG, '    update_collection_result')
    resMethods.sendResult({}, req, res)
    log.timeEnd(DEBUG, '    update_collection_result')

    log.timeEnd(DEBUG, 'update_collection')
  }
}
