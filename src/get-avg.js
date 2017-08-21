const getVisitedFilter = require('./get-visited-filter')
const innerJoin = require('./inner-join')
const queryParamsAreValid = require('./query-params-are-valid')
const log = require('./log')

function getAgeTimestamp (age, now) {
  return Math.round(now - (age * 365.24 * 24 * 60 * 60))
}

function getAgeFilter (req, timestamp) {
  let filter

  if (req.query.fromAge && req.query.toAge) {
    filter = { '$between': [getAgeTimestamp(req.query.toAge, timestamp), getAgeTimestamp(req.query.fromAge, timestamp) - 1] }
  } else if (req.query.fromAge) {
    filter = { '$lt': getAgeTimestamp(req.query.fromAge, timestamp) }
  } else if (req.query.toAge) {
    filter = { '$gt': getAgeTimestamp(req.query.toAge, timestamp) }
  }

  return filter
}

module.exports = function (DEBUG, db, timestamp) {
  return function (req, res) {
    log.time(DEBUG, 'get_avg')

    // log.time(DEBUG, '   locations')
    if (!db.getCollection('locations').find({ id: Number(req.params.id) }).length) {
      res.status(404).send()
      return
    }
    // log.timeEnd(DEBUG, '   locations')

    // log.time(DEBUG, '   validParams')
    if (!queryParamsAreValid(req.query, ['gender', 'toDate', 'fromDate', 'fromAge', 'toAge'])) {
      res.status(400).send()
      return
    }
    // log.timeEnd(DEBUG, '   validParams')

    let visitsFilter = {
      location: Number(req.params.id)
    }

    const visitedAd = getVisitedFilter(req)
    if (visitedAd) {
      visitsFilter.visited_at = visitedAd
    }

    const visits = db.getCollection('visits').find(visitsFilter)

    let usersFilter = {
      id: { '$in': visits.map(visit => visit.user) }
    }

    const ageFilter = getAgeFilter(req, timestamp)
    if (ageFilter) {
      usersFilter.birth_date = ageFilter
    }
    if (req.query.gender) {
      usersFilter.gender = req.query.gender
    }

    const users = db.getCollection('users').find(usersFilter)

    let joined = innerJoin(visits, users, 'user', 'id')

    if (joined.length) {
      res.status(200).send({
        avg: Number((joined.reduce((acc, cur) => {
          return acc + cur.mark
        }, 0) / joined.length).toFixed(5))
      })
    } else {
      res.status(200).send({
        avg: 0
      })
    }

    log.timeEnd(DEBUG, 'get_avg')
  }
}
