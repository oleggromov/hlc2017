module.exports = (req, cb, err) => {
  let body = []
  req.on('data', (chunk) => {
    body.push(chunk)
  }).on('end', () => {
    const str = Buffer.concat(body).toString()

    try {
      cb(JSON.parse(str))
    } catch (e) {
      err(e, str)
    }
  })
}
