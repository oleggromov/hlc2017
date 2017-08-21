const isNumber = (param) => {
  return Boolean(param) && !isNaN(Number(param))
}

const notNull = (param) => {
  return Boolean(param)
}

const validation = {
  visits: {
    user: isNumber,
    location: isNumber,
    visited_at: isNumber,
    id: isNumber,
    mark: isNumber
  },
  locations: {
    distance: isNumber,
    id: isNumber,
    city: notNull,
    place: notNull,
    country: notNull
  },
  users: {
    birth_date: isNumber,
    id: isNumber,
    first_name: notNull,
    last_name: notNull,
    gender: notNull,
    email: notNull
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
