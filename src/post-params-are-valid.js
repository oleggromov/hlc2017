const isNumber = (param) => {
  return Boolean(param) && typeof param === 'number' && !isNaN(Number(param))
}

const isString = (param) => {
  return typeof param === 'string'
}

const notNull = (param) => {
  return Boolean(param)
}

const validation = {
  visits: {
    id: isNumber,
    user: isNumber,
    location: isNumber,
    visited_at: isNumber,
    mark: isNumber
  },
  locations: {
    id: isNumber,
    distance: isNumber,
    city: isString,
    place: isString,
    country: isString
  },
  users: {
    id: isNumber,
    birth_date: isNumber,
    first_name: notNull,
    last_name: notNull,
    gender: notNull,
    email: isString
  }
}

function postParamsAreValid (collection, params) {
  let exist = false

  for (param in params) {
    exist = true
    if (validation[collection][param] && !validation[collection][param](params[param])) {
      return false
    }
  }

  return exist
}

module.exports = postParamsAreValid
