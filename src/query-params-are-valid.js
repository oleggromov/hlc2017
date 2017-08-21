const numbers = {
	toDate: true,
	fromDate: true,
	toAge: true,
	fromAge: true,
	toDistance: true
}

function queryParamsAreValid (reqQuery, paramsList) {
  for (param of paramsList) {
  	if (numbers[param] && reqQuery[param] && isNaN(Number(reqQuery[param]))) {
  		return false
  	}
  }

  if (paramsList.find(param => param === 'gender')) {
    if (reqQuery['gender'] && (reqQuery['gender'] !== 'f' && reqQuery['gender'] !== 'm')) {
      return false
    }
  }

  return true
}

module.exports = queryParamsAreValid
