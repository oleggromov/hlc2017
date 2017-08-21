const stripLokiMeta = require('./strip-loki-meta')

module.exports = function (db) {
  return function (req, res) {
    // console.time('get_collection')

    let result = db
      .getCollection(req.params.collection)
      .find({ id: Number(req.params.id) })

    if (result.length) {
      res.status(200).send(stripLokiMeta(result[0]))
    } else {
      res.status(404).send()
    }

    // console.timeEnd('get_collection')
  }
}
