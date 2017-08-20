function getAgeTimestamp (age) {
  const now = parseInt(Date.now() / 1000, 10)
  return now - (age * 365 * 24 * 60 * 60)
}

module.exports = function (db) {
  return function (req, res) {
    console.time('get_avg')

    let join = ''
    let where = ''

    if (req.query.fromDate && req.query.toDate) {
      where += `AND visited_at BETWEEN ${Number(req.query.fromDate) + 1} AND ${Number(req.query.toDate) - 1}\n`
    } else if (req.query.fromDate) {
      where += `AND visited_at > ${Number(req.query.fromDate)}\n`
    } else if (req.query.toDate) {
      where += `AND visited_at < ${Number(req.query.toDate)}\n`
    }

    if (req.query.gender || req.query.fromAge || req.query.toAge ) {
      join = `INNER JOIN users AS u
        ON visits.user = u.id`

      if (req.query.gender) {
        where += `AND u.gender = '${req.query.gender}'\n`
      }

      if (req.query.fromAge) {
        where += `AND u.birth_date <= ${getAgeTimestamp(Number(req.query.fromAge))}`
      }

      if (req.query.toAge) {
        where += `AND u.birth_date > ${getAgeTimestamp(Number(req.query.toAge))}`
      }
    }

    const result = db.exec(`SELECT AVG(mark) FROM visits
      ${join}
      WHERE location = ${Number(req.params.id)}
      ${where}
      ORDER BY visited_at`)

    if (result.length && result[0]['AVG(mark)']) {
      res.status(200).send({
        avg: Number(result[0]['AVG(mark)'].toFixed(5))
      })
    } else {
      res.status(404).send()
    }
    console.timeEnd('get_avg')
  }
}
