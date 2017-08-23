const closeSocket = (req, res) => {
  if (req.headers.connection.toLowerCase() !== 'keep-alive') {
    res.socket.end()
  }
}

const sendResult = (result, req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(result), 'utf8')
  closeSocket(req, res)
}

const sendBadRequest = (req, res) => {
  res.statusCode = 400
  res.end()
  closeSocket(req, res)
}

const sendNotFound = (req, res) => {
  res.statusCode = 404
  res.end()
  closeSocket(req, res)
}

module.exports = {
  sendResult,
  sendBadRequest,
  sendNotFound
}
