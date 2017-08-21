module.exports = {
  log: (DEBUG, msg) => {
    if (DEBUG) {
      console.log(msg)
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
