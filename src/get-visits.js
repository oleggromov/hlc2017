const stripLokiMeta = require('./strip-loki-meta')

function stripExtra (result) {
  return result.map(item => {
    delete item.user
    delete item.id

    return item
  })
}

module.exports = function (db) {
  return function (req, res) {
    console.time('get_visits')

    let filter = {
      user: Number(req.params.id)
    }

    // if (req.query.fromDate && req.query.toDate) {
    //   // TODO is it correct?
    //   filter.visited_at = { '$between': [Number(req.query.fromDate) + 1, Number(req.query.toDate) - 1] }
    // } else if (req.query.fromDate) {
    //   filter.visited_at = { '$gt': Number(req.query.fromDate) }
    // } else if (req.query.toDate) {
    //   filter.visited_at = { '$lt': Number(req.query.toDate) }
    // }

    // if (req.query.country && req.query.toDistance) {
    //   const countryBound = db.getCollection('locations').find({
    //     country: req.query.country,
    //     distance: { '$lt': Number(req.query.toDistance) }
    //   })

    //   if (countryBound.length) {
    //     filter.location = { '$in': countryBound.map(location => location.id) }
    //   } else {
    //     // TODO is it correct?
    //     filter.location = { '$in': [-1] }
    //   }
    // } else if (req.query.country) {
    //   const countryBound = db.getCollection('locations')
    //     .find({ country: req.query.country })

    //   if (countryBound.length) {
    //     filter.location = { '$in': countryBound.map(location => location.id) }
    //   } else {
    //     // TODO is it correct?
    //     filter.location = { '$in': [-1] }
    //   }
    // } else if (req.query.toDistance) {
    //   const countryBound = db.getCollection('locations')
    //     .find({ distance: { '$lt': Number(req.query.toDistance) } })

    //   if (countryBound.length) {
    //     filter.location = { '$in': countryBound.map(location => location.id) }
    //   } else {
    //     // TODO is it correct?
    //     filter.location = { '$in': [-1] }
    //   }
    // }

    let visits = db.getCollection('visits')
      .chain()
      .find(filter)
      // .simplesort('visited_at')
      // .data()

    // if (visits.length) {
      let locations = db.getCollection('locations').chain()
      let joined = visits.eqJoin(locations, 'location', 'id')

      console.log(locations)
      console.log(joined)

      joined = joined
        .simplesort('visited_at')
        .data()

      res.status(200).send({
        // visits: stripLokiMeta(stripExtra(results))
        visits: stripLokiMeta(joined)
      })
    // } else {
    //   res.status(404).send()
    // }

    console.timeEnd('get_visits')
  }
}

