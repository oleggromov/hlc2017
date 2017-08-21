function innerJoin (left, right, leftProp, rightProp) {
  return left.map(leftItem => {
    let rightItem = right.find(rightItem => rightItem[rightProp] === leftItem[leftProp])
    if (rightItem) {
      return Object.assign({}, leftItem, rightItem)
    }
  }).filter(item => Boolean(item))
}

module.exports = innerJoin
