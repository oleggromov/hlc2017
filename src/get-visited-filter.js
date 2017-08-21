function getVisitedFilter (req) {
  let filter

  if (req.query.fromDate && req.query.toDate) {
    // TODO is it correct?
    filter = { '$between': [Number(req.query.fromDate) + 1, Number(req.query.toDate) - 1] }
  } else if (req.query.fromDate) {
    filter = { '$gt': Number(req.query.fromDate) }
  } else if (req.query.toDate) {
    filter = { '$lt': Number(req.query.toDate) }
  }

  return filter
}

module.exports = getVisitedFilter
