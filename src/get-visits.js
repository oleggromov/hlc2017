const stripLokiMeta = require('./strip-loki-meta')
const innerJoin = require('./inner-join')
const getVisitedFilter = require('./get-visited-filter')
const queryParamsAreValid = require('./query-params-are-valid')

module.exports = function (db) {
  return function (req, res) {
    // console.time('get_visits')

    let visitsFilter = {
      user: Number(req.params.id)
    }

    // console.time('   users')
    if (!db.getCollection('users').find({ id: Number(req.params.id) }).length) {
      res.status(404).send()
      return
    }
    // console.timeEnd('   users')

    // console.time('   validParams')
    if (!queryParamsAreValid(req.query, ['toDistance', 'toDate', 'fromDate'])) {
      res.status(400).send()
      return
    }
    // console.timeEnd('   validParams')

    const visitedAd = getVisitedFilter(req)
    if (visitedAd) {
      visitsFilter.visited_at = visitedAd
    }

    // console.time('   visits')
    const visits = db.getCollection('visits').find(visitsFilter)
    // console.timeEnd('   visits')

    let locationsFilter = {
      id: { '$in': visits.map(visit => visit.location) }
    }

    if (req.query.country) {
      locationsFilter.country = req.query.country
    }
    if (req.query.toDistance) {
      locationsFilter.distance = { '$lt': Number(req.query.toDistance) }
    }

    // console.time('   locations')
    const locations = db.getCollection('locations').find(locationsFilter)
    // console.timeEnd('   locations')

    // console.time('   join')
    let joined = innerJoin(visits, locations, 'location', 'id')
    // console.timeEnd('   join')

    // console.time('   map')
    if (joined.length) {
      joined = joined.map(item => ({
        mark: item.mark,
        visited_at: item.visited_at,
        place: item.place
      })).sort((a, b) => a.visited_at - b.visited_at)
    }
    // console.timeEnd('   map')

    // console.time('   result')
    res.status(200).send({
      visits: joined
    })
    // console.timeEnd('   result')

    // console.timeEnd('get_visits')
  }
}

