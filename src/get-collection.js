const stripLokiMeta = require('./strip-loki-meta')
const log = require('./log')

module.exports = function (DEBUG, db) {
  return function (req, res) {
    log.time(DEBUG, 'get_collection')

    log.time(DEBUG, '    get_collection_getCollection')
    let result = db
      .getCollection(req.params.collection)
      .find({ id: Number(req.params.id) })
    log.timeEnd(DEBUG, '    get_collection_getCollection')

    log.time(DEBUG, '    get_collection_send')
    if (result.length) {
      res.status(200).send(stripLokiMeta(result[0]))
    } else {
      res.status(404).send()
    }
    log.timeEnd(DEBUG, '    get_collection_send')

    log.timeEnd(DEBUG, 'get_collection')
  }
}
