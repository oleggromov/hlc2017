function strip (item) {
  let modified = Object.assign({}, item)

  delete modified['meta']
  delete modified['$loki']

  return modified
}

module.exports = function (result) {
  return Array.isArray(result)
    ? result.map(strip)
    : strip(result)
}
