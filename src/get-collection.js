module.exports = function (db) {
  return function (req, res) {
    console.time('get_collection')

    const result = db.exec(`SELECT * FROM ${req.params.collection} WHERE id = ${Number(req.params.id)} LIMIT 1`)

    if (result.length) {
      res.status(200).send(result[0])
    } else {
      res.status(404).send()
    }

    console.timeEnd('get_collection')
  }
}
