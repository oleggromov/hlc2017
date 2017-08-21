const postParamsAreValid = require('./post-params-are-valid')
const log = require('./log')

module.exports = function (DEBUG, db) {
  return function (req, res) {
    log.time(DEBUG, 'post_collection')

    log.time(DEBUG, '    post_collection_validate')
    if (!postParamsAreValid(req.params.collection, req.body)) {
      res.status(400).send()
      return
    }
    log.timeEnd(DEBUG, '    post_collection_validate')

    log.time(DEBUG, '    post_collection_insert')
    let result = db.getCollection(req.params.collection).insert(req.body)
    log.timeEnd(DEBUG, '    post_collection_insert')

    log.time(DEBUG, '    post_collection_result')
    res.status(200).send({})
    log.timeEnd(DEBUG, '    post_collection_result')

    log.timeEnd(DEBUG, 'post_collection')
  }
}
