const stripLokiMeta = require('./strip-loki-meta')

module.exports = function (db) {
  return function (req, res) {
    console.time('get_collection')

    let result = db
      .getCollection(req.params.collection)
      .by('id', Number(req.params.id))

    if (result) {
      res.status(200).send(stripLokiMeta(result))
    } else {
      res.status(404).send()
    }

    console.timeEnd('get_collection')
  }
}
