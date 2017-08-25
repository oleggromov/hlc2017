function innerJoin (left, right, leftProp, rightProp) {
  const rightMap = right.reduce((map, cur) => {
    map[cur[rightProp]] = cur
    return map
  }, {})

  return left.map(leftItem => {
    let rightItem = rightMap[leftItem[leftProp]]
    if (rightItem) {
      return Object.assign({}, leftItem, rightItem)
    }
  }).filter(item => Boolean(item))
}

module.exports = innerJoin
