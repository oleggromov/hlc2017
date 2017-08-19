const stripLokiMeta = require('./strip-loki-meta')

module.exports = function (db) {
  return function (req, res) {
    console.time('get_avg')

    const visits = db.getCollection('visits')
      .find({ location: Number(req.params.id) })

    if (visits.length) {
      const avg = visits.reduce((acc, location) => {
        return acc + location.mark
      }, 0) / visits.length

      res.status(200).send({
        avg: Number(avg.toFixed(5))
      })
    } else {
      res.status(200).send({ avg: 0.0 })
    }

    console.timeEnd('get_avg')
  }
}
