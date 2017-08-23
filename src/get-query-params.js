const querystring = require('querystring')

module.exports = (url) => {
  const questionMarkIndex = url.indexOf('?')

  if (questionMarkIndex > -1) {
    return querystring.parse(url.slice(questionMarkIndex + 1))
  }

  return null
}
