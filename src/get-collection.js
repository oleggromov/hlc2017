const stripLokiMeta = require('./strip-loki-meta')
const log = require('./log')

module.exports = function (DEBUG, db) {
  return function (req, res) {
    log.time(DEBUG, 'get_collection')

    let result = db
      .getCollection(req.params.collection)
      .find({ id: Number(req.params.id) })

    if (result.length) {
      res.status(200).send(stripLokiMeta(result[0]))
    } else {
      res.status(404).send()
    }

    log.timeEnd(DEBUG, 'get_collection')
  }
}
