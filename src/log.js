module.exports = {
  log: (DEBUG, ...args) => {
    if (DEBUG) {
      console.log.apply(console, args)
    }
  },
  time: (DEBUG, name) => {
    if (DEBUG) {
      console.time(name)
    }
  },
  timeEnd: (DEBUG, name) => {
    if (DEBUG) {
      console.timeEnd(name)
    }
  }
}
