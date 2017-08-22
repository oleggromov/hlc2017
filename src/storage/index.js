let collections = {}
let indexes = {}

const getCollection = (name) => ({
  insert: (data) => {
    collections[name] = collections[name].concat(data)
  },

  count: () => {
    return collections[name].length
  },

  find: (condition) => {
    if (condition.id !== undefined) {
      if (!condition.id || isNaN(condition.id)) {
        return undefined
      }

      return indexes[name][condition.id]
    }

    throw new Error(`storage:find cannot find by "${JSON.stringify(condition)}"`)
  },

  ensureIndex: (prop) => {
    if (prop === 'id') {
      indexes[name] = collections[name].reduce((index, item) => {
        if (item.id && !index[item.id]) {
          index[item.id] = item
        } else {
          throw new Error(`storage:ensureIndex found duplicate id ${item.id}`)
        }

        return index
      }, [])
    } else {
      throw new Error(`storage:ensureIndex cannot build index by "${prop}"`)
    }
  }
})

module.exports = {
  addCollection: (name) => {
    collections[name] = []
    indexes[name] = []
    return getCollection(name)
  },

  getCollection
}
