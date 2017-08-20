// const stripLokiMeta = require('./strip-loki-meta')

function stripExtra (result) {
  return result.map(item => {
    return {
      mark: item.mark,
      visited_at: item.visited_at,
      place: item.place
    }
  })
}

module.exports = function (db) {
  return function (req, res) {
    console.time('get_visits')

    let where = ''
    let join = ''

    if (req.query.fromDate && req.query.toDate) {
      where += `AND visited_at BETWEEN ${Number(req.query.fromDate) + 1} AND ${Number(req.query.toDate) - 1}\n`
    } else if (req.query.fromDate) {
      where += `AND visited_at > ${Number(req.query.fromDate)}\n`
    } else if (req.query.toDate) {
      where += `AND visited_at < ${Number(req.query.toDate)}\n`
    }

    if (req.query.country || req.query.toDistance) {
      join = `INNER JOIN locations AS loc
        ON visits.location = loc.id`

      if (req.query.country) {
        where += `AND loc.country = '${req.query.country}'\n`
      }

      if (req.query.toDistance) {
        where += `AND loc.distance < ${req.query.toDistance} \n`
      }
    }

    const results = db.exec(`SELECT * FROM visits
      ${join}
      WHERE user = ${Number(req.params.id)}
        ${where}
      ORDER BY visited_at`)

    if (results.length) {
      res.status(200).send({
        visits: stripExtra(results)
      })
    } else {
      res.status(404).send()
    }

    console.timeEnd('get_visits')
  }
}
