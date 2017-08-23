const stripLokiMeta = require('./strip-loki-meta')
const innerJoin = require('./inner-join')
const getVisitedFilter = require('./get-visited-filter')
const queryParamsAreValid = require('./query-params-are-valid')
const log = require('./log')

module.exports = function (DEBUG, db) {
  return function (req, res) {
    log.time(DEBUG, 'get_visits')

    let visitsFilter = {
      user: Number(req.params.id)
    }

    log.time(DEBUG, '    get_visits_users')
    if (!db.getCollection('users').find({ id: Number(req.params.id) }).length) {
      res.status(404).send()
      return
    }
    log.timeEnd(DEBUG, '    get_visits_users')

    log.time(DEBUG, '    get_visits_validParams')
    if (!queryParamsAreValid(req.query, ['toDistance', 'toDate', 'fromDate'])) {
      res.status(400).send()
      return
    }
    log.timeEnd(DEBUG, '    get_visits_validParams')

    const visitedAt = getVisitedFilter(req)
    if (visitedAt) {
      visitsFilter.visited_at = visitedAt
    }

    log.time(DEBUG, '    get_visits_visits')
    const visits = db.getCollection('visits').find(visitsFilter)
    log.timeEnd(DEBUG, '    get_visits_visits')

    let locationsFilter = {
      id: { '$in': visits.map(visit => visit.location) }
    }

    if (req.query.country) {
      locationsFilter.country = req.query.country
    }
    if (req.query.toDistance) {
      locationsFilter.distance = { '$lt': Number(req.query.toDistance) }
    }

    log.time(DEBUG, '    get_visits_locations')
    const locations = db.getCollection('locations').find(locationsFilter)
    log.timeEnd(DEBUG, '    get_visits_locations')

    log.time(DEBUG, '    get_visits_join')
    let joined = innerJoin(visits, locations, 'location', 'id')
    log.timeEnd(DEBUG, '    get_visits_join')

    log.time(DEBUG, '    get_visits_map')
    if (joined.length) {
      joined = joined.map(item => ({
        mark: item.mark,
        visited_at: item.visited_at,
        place: item.place
      })).sort((a, b) => a.visited_at - b.visited_at)
    }
    log.timeEnd(DEBUG, '    get_visits_map')

    log.time(DEBUG, '    get_visits_result')
    res.status(200).send({
      visits: joined
    })
    log.timeEnd(DEBUG, '    get_visits_result')

    log.timeEnd(DEBUG, 'get_visits')
  }
}

