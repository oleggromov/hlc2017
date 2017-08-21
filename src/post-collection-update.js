const postParamsAreValid = require('./post-params-are-valid')
const log = require('./log')

module.exports = function (DEBUG, db) {
  return function (req, res) {
    log.time(DEBUG, 'update_collection')

    log.time(DEBUG, '    update_collection_exists')
    let source = db.getCollection(req.params.collection).findOne({ id: Number(req.params.id) })

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
    log.timeEnd(DEBUG, '    update_collection_changeProps')

    log.time(DEBUG, '    update_collection_result')
    res.status(200).send({})
    log.timeEnd(DEBUG, '    update_collection_result')

    log.timeEnd(DEBUG, 'update_collection')
  }
}
