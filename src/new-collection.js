const inserts = require('./inserts')

module.exports = function (db) {
  return function (req, res) {
    console.time('new_collection')

    try {
      switch (req.params.collection) {
        case 'users':
          db.exec(inserts.users, req)
        break;
        case 'locations':
          db.exec(insers.locations, req)
        break;
        case 'visits':
          db.exec(inserts.visits, req)
        break;
      }
      res.status(200).send({})
    } catch (e) {
      res.status(400).send()
    }

    console.timeEnd('new_collection')
  }
}
