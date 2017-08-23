const stripLokiMeta = require('./strip-loki-meta')
const innerJoin = require('./inner-join')
const getVisitedFilter = require('./get-visited-filter')
const queryParamsAreValid = require('./query-params-are-valid')
const log = require('./log')
const resMethods = require('./res-methods')
const getQueryParams = require('./get-query-params')

const getParams = (match, url) => {
  let params = {
    userId: Number(match[1]),
    query: {}
  }

  const queryParams = getQueryParams(url)
  if (queryParams) {
    if (queryParams.toDistance) {
      params.query.toDistance = Number(queryParams.toDistance)
    }

    if (queryParams.fromDate) {
      params.query.fromDate = Number(queryParams.fromDate)
    }

    if (queryParams.toDate) {
      params.query.toDate = Number(queryParams.toDate)
    }

    if (queryParams.country) {
      params.query.country = queryParams.country
    }
  }

  return params
}

module.exports = function (DEBUG, db) {
  return function (match, req, res) {
    log.time(DEBUG, 'get_visits')

    log.time(DEBUG, '    get_visits_parseUrl')
    const params = getParams(match, req.url)
    log.timeEnd(DEBUG, '    get_visits_parseUrl')

    let visitsFilter = {
      user: params.userId
    }

    log.time(DEBUG, '    get_visits_users')
    if (!db.getCollection('users').find({ id: params.userId }).length) {
      resMethods.sendNotFound(req, res)
      return
    }
    log.timeEnd(DEBUG, '    get_visits_users')

    log.time(DEBUG, '    get_visits_validParams')
    if (!queryParamsAreValid(params.query, ['toDistance', 'toDate', 'fromDate'])) {
      resMethods.sendBadRequest(req, res)
      return
    }
    log.timeEnd(DEBUG, '    get_visits_validParams')

    const visitedAt = getVisitedFilter(params.query)
    if (visitedAt) {
      visitsFilter.visited_at = visitedAt
    }

    log.time(DEBUG, '    get_visits_visits')
    const visits = db.getCollection('visits').find(visitsFilter)
    log.timeEnd(DEBUG, '    get_visits_visits')

    let locationsFilter = {
      id: { '$in': visits.map(visit => visit.location) }
    }

    if (params.query.country) {
      locationsFilter.country = params.query.country
    }
    if (params.query.toDistance) {
      locationsFilter.distance = { '$lt': params.query.toDistance }
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
    resMethods.sendResult({
      visits: joined
    }, req, res)
    log.timeEnd(DEBUG, '    get_visits_result')

    log.timeEnd(DEBUG, 'get_visits')
  }
}

