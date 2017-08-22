const postParamsAreValid = require('./post-params-are-valid')
const log = require('./log')

module.exports = function (DEBUG, db) {
  return function (req, res) {
    log.time(DEBUG, 'update_collection')
    log.log(DEBUG, req.originalUrl, JSON.stringify(req.body))

    const collection = db.getCollection(req.params.collection)

    log.time(DEBUG, '    update_collection_exists')
    let source = collection.findOne({ id: Number(req.params.id) })

    if (!source) {
      res.status(404).send()
      return
    }
    log.timeEnd(DEBUG, '    update_collection_exists')

    log.time(DEBUG, '    update_collection_validate')
    if (!postParamsAreValid(req.params.collection, req.body)) {
      res.status(400).send()
      return
    }
    log.timeEnd(DEBUG, '    update_collection_validate')

    log.time(DEBUG, '    update_collection_changeProps')
    Object.assign(source, req.body)
    collection.update(source)
    log.timeEnd(DEBUG, '    update_collection_changeProps')

    log.time(DEBUG, '    update_collection_result')
    res.status(200).send({})
    log.timeEnd(DEBUG, '    update_collection_result')

    log.timeEnd(DEBUG, 'update_collection')
  }
}
