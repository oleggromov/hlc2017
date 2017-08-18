const express = require('express')
const app = express()

const path = require('path')
const loadJsons = require('./load-jsons')

const stripLokiMeta = require('./strip-loki-meta')

console.time('load_data_time')
const db = loadJsons(path.resolve(__dirname, './data'))
console.timeEnd('load_data_time')

console.log('Loaded:')
console.log(`${db.getCollection('users').count()} users`)
console.log(`${db.getCollection('locations').count()} locations`)
console.log(`${db.getCollection('visits').count()} visits`)

app.get('/:collection/:id', function (req, res) {
  console.time('get_collection')

  let result = db
    .getCollection(req.params.collection)
    // .findOne({ 'id': Number(req.params.id) })
    .by('id', Number(req.params.id))

  if (result) {
    res.status(200).send(stripLokiMeta(result))
  } else {
    res.status(404).send()
  }

  console.timeEnd('get_collection')
})

app.get('/users/:id/visits', function (req, res) {
  console.time('get_visits')

  let filter = {
    user: Number(req.params.id)
  }

  if (req.query.fromDate && req.query.toDate) {
    // TODO is it correct?
    filter.visited_at = { '$between': [Number(req.query.fromDate) + 1, Number(req.query.toDate) - 1] }
  } else if (req.query.fromDate) {
    filter.visited_at = { '$gt': Number(req.query.fromDate) }
  } else if (req.query.toDate) {
    filter.visited_at = { '$lt': Number(req.query.toDate) }
  }

  if (req.query.country && req.query.toDistance) {
    const countryBound = db.getCollection('locations').find({
      country: req.query.country,
      distance: { '$lt': Number(req.query.toDistance) }
    })

    if (countryBound.length) {
      filter.location = { '$in': countryBound.map(location => location.id) }
    } else {
      // TODO is it correct?
      filter.location = { '$in': [-1] }
    }
  } else if (req.query.country) {
    const countryBound = db.getCollection('locations')
      .find({ country: req.query.country })

    if (countryBound.length) {
      filter.location = { '$in': countryBound.map(location => location.id) }
    } else {
      // TODO is it correct?
      filter.location = { '$in': [-1] }
    }
  } else if (req.query.toDistance) {
    const countryBound = db.getCollection('locations')
      .find({ distance: { '$lt': Number(req.query.toDistance) } })

    if (countryBound.length) {
      filter.location = { '$in': countryBound.map(location => location.id) }
    } else {
      // TODO is it correct?
      filter.location = { '$in': [-1] }
    }
  }

  let results = db.getCollection('visits')
    .chain()
    .find(filter)
    .simplesort('visited_at')
    .data()

  if (results.length) {
    res.status(200).send({
      visits: stripLokiMeta(results)
    })
  } else {
    res.status(404).send()
  }

  console.timeEnd('get_visits')
})

const port = 80

app.listen(port, function () {
  console.log(`Listening on port ${port}!`)
})
