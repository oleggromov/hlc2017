const getVisitedFilter = require('./get-visited-filter')
const innerJoin = require('./inner-join')
const queryParamsAreValid = require('./query-params-are-valid')
const log = require('./log')
const resMethods = require('./res-methods')
const getQueryParams = require('./get-query-params')

function getAgeTimestamp (age, now) {
  return Math.round(now - (age * 365.24 * 24 * 60 * 60))
}

const getParams = (match, url) => {
  let params = {
    locationId: Number(match[1]),
    query: {}
  }

  const queryParams = getQueryParams(url)
  if (queryParams) {
    if (queryParams.gender) {
      params.query.gender = queryParams.gender
    }

    if (queryParams.fromAge) {
      params.query.fromAge = Number(queryParams.fromAge)
    }

    if (queryParams.toAge) {
      params.query.toAge = Number(queryParams.toAge)
    }

    if (queryParams.fromDate) {
      params.query.fromDate = Number(queryParams.fromDate)
    }

    if (queryParams.toDate) {
      params.query.toDate = Number(queryParams.toDate)
    }
  }

  return params
}


function getAgeFilter (queryParams, timestamp) {
  let filter

  if (queryParams.fromAge && queryParams.toAge) {
    filter = { '$between': [getAgeTimestamp(queryParams.toAge, timestamp), getAgeTimestamp(queryParams.fromAge, timestamp) - 1] }
  } else if (queryParams.fromAge) {
    filter = { '$lt': getAgeTimestamp(queryParams.fromAge, timestamp) }
  } else if (queryParams.toAge) {
    filter = { '$gt': getAgeTimestamp(queryParams.toAge, timestamp) }
  }

  return filter
}

module.exports = function (DEBUG, db, timestamp) {
  return function (match, req, res) {
    log.time(DEBUG, 'get_avg')

    log.time(DEBUG, '    get_avg_parseUrl')
    const params = getParams(match, req.url)
    log.timeEnd(DEBUG, '    get_avg_parseUrl')

    log.time(DEBUG, '    get_avg_location_exists')
    if (!db.getCollection('locations').find({ id: params.locationId }).length) {
      resMethods.sendNotFound(req, res)
      return
    }
    log.timeEnd(DEBUG, '    get_avg_location_exists')

    log.time(DEBUG, '    get_avg_params_validParams')
    if (!queryParamsAreValid(params.query, ['gender', 'toDate', 'fromDate', 'fromAge', 'toAge'])) {
      resMethods.sendBadRequest(req, res)
      return
    }
    log.timeEnd(DEBUG, '    get_avg_params_validParams')

    let visitsFilter = {
      location: params.locationId
    }

    log.time(DEBUG, '    get_avg_visits')
    const visitedAd = getVisitedFilter(params.query)
    if (visitedAd) {
      visitsFilter.visited_at = visitedAd
    }

    const visits = db.getCollection('visits').find(visitsFilter)
    log.timeEnd(DEBUG, '    get_avg_visits')

    let usersFilter = {
      id: { '$in': visits.map(visit => visit.user) }
    }

    log.time(DEBUG, '    get_avg_users')
    const ageFilter = getAgeFilter(params.query, timestamp)
    if (ageFilter) {
      usersFilter.birth_date = ageFilter
    }
    if (params.query.gender) {
      usersFilter.gender = params.query.gender
    }

    const users = db.getCollection('users').find(usersFilter)
    log.timeEnd(DEBUG, '    get_avg_users')

    log.time(DEBUG, '    get_avg_join')
    let joined = innerJoin(visits, users, 'user', 'id')
    log.timeEnd(DEBUG, '    get_avg_join')

    log.time(DEBUG, '    get_avg_result')
    if (joined.length) {
      resMethods.sendResult({
        avg: Number((joined.reduce((acc, cur) => {
          return acc + cur.mark
        }, 0) / joined.length).toFixed(5))
      }, req, res)
    } else {
      resMethods.sendResult({
        avg: 0
      }, req, res)
    }
    log.timeEnd(DEBUG, '    get_avg_result')

    log.timeEnd(DEBUG, 'get_avg')
  }
}
