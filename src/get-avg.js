const getVisitedFilter = require('./get-visited-filter')
const innerJoin = require('./inner-join')

function getAgeTimestamp (age, now) {
  return Math.round(now - (age * 365 * 24 * 60 * 60))
}

function getAgeFilter (req, timestamp) {
  let filter

  if (req.params.fromAge && req.params.toAge) {
    filter = { '$between': [getAgeTimestamp(req.params.toAge, timestamp), getAgeTimestamp(req.params.fromAge, timestamp) - 1] }
  } else if (req.params.fromAge) {
    filter = { '$lt': getAgeTimestamp(req.params.fromAge, timestamp) }
  } else if (req.params.toAge) {
    filter = { '$gt': getAgeTimestamp(req.params.toAge, timestamp) }
  }

  return filter
}

module.exports = function (db, timestamp) {
  return function (req, res) {
    console.time('get_avg')

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
    if (req.params.gender) {
      usersFilter.gender = req.params.gender
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

    // if (visits.length) {
    //   const avg = visits.reduce((acc, location) => {
    //     return acc + location.mark
    //   }, 0) / visits.length

    //   res.status(200).send({
    //     avg: Number(avg.toFixed(5))
    //   })
    // } else {
    //   res.status(200).send({ avg: 0.0 })
    // }

    console.timeEnd('get_avg')
  }
}
