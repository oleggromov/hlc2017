function getVisitedFilter (queryParams) {
  let filter

  if (queryParams.fromDate && queryParams.toDate) {
    // TODO is it correct?
    filter = { '$between': [queryParams.fromDate + 1, queryParams.toDate - 1] }
  } else if (queryParams.fromDate) {
    filter = { '$gt': queryParams.fromDate }
  } else if (queryParams.toDate) {
    filter = { '$lt': queryParams.toDate }
  }

  return filter
}

module.exports = getVisitedFilter
