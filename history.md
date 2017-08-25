# How it goes

1. Finding base image for Docker

    http://phusion.github.io/baseimage-docker/
    https://github.com/phusion/baseimage-docker

2. Install node js into container

    https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

3. Building and rebuilding

    docker build . -t hlc2017

4. data.zip

  Trying to mount data directory:

    https://stackoverflow.com/questions/23439126/how-to-mount-host-directory-in-docker-container

  And run:

    docker rm $(docker ps -aq --filter name=hlc)
    docker run --name hlc -v /Users/gromych/home_projects/hlc2017/data:/tmp/data hlc2017


5. unzipping and running node

  `CMD` should be present only once:

    https://stackoverflow.com/questions/23692470/why-cant-i-use-docker-cmd-multiple-times-to-run-multiple-services

6. todo

  - import all data
    - in memory first
    - choose a in-memory storage

7. LokiJS

    https://rawgit.com/techfort/LokiJS/master/jsdoc/Loki.html

  It's a rather lightweight MongoDB clone

8. It's annoying to implement joins without a relational database so I decided to try in-memory SQL

    https://github.com/agershun/alasql

  According to the first measurements, it's about 10 times slower than LokiJS. Maybe I'll have to switch back to by-hand collection manipulation

9. implemented everything in LokiJS

  - Rather complex aggregated requsts are slow because of bad or non-existent binary search indices
  - posts work rather well

  TODO: think about how to recalculate indices.

10. Profiling

    https://gist.github.com/oleggromov/49c001d6f50f7b96c957cfc96da4c2d5

  Profiling showed that most of the time goes to LokiJS but I don't understand how to separate initial indexes building from the actual app runtime.

11. Found that it's an anti-pattern to leave synchronous functions in production for answering requests

    http://expressjs.com/en/advanced/best-practice-performance.html

  My app doesn't use any IO except actual HTTP req/res handling. Wrapping answer functions into setTimeout(..., 0) dropped RPS from 1400+ to ~450.

12. Reading the profiling results

    https://stackoverflow.com/questions/23934451/how-to-read-nodejs-internal-profiler-tick-processor-output

    https://groups.google.com/forum/#!topic/nodejs/oRbX5eZvOPg

13. Built getById indexes on array/object

  There's no significant difference: 2278 (hand-built array) vs 2223 (hand-built object) vs 2165 (loki) rps.

  The problem is, after a few sequential round of requests service stops answering by timeout (-1).

14. Found issues with update

  First, I used incorrect way of updating without notifying the collection. Correct one is:

    // modify original object
    obj.prop = 123
    // notify the collection
    collection.update(obj)

  Second, I used `strip-loki-meta` that changed original objects.

15. New result

  The new correct result is *1928.73657 s*

  ToDo:
    - replace express with hand-made server

16. Replaced express on get-handlers

  From:

    $ ./start-all.sh
    bullets count: 6000
    Start test run
    Done. 6000 queries in 2422 ms => 2477 rps
    Check the answers...
    All answers is OK
    bullets count: 12000
    Start test run
    Done. 12000 queries in 38059 ms => 315 rps
    Check the answers...
    All answers is OK
    bullets count: 42000
    Start test run
    Done. 42000 queries in 13780 ms => 3048 rps
    Check the answers...
    All answers is OK

  To:

    $ ./start-all.sh
    bullets count: 6000
    Start test run
    Done. 6000 queries in 1286 ms => 4666 rps
    Check the answers...
    All answers is OK
    bullets count: 12000
    Start test run
    Done. 12000 queries in 33510 ms => 358 rps
    Check the answers...
    All answers is OK
    bullets count: 42000
    Start test run
    Done. 42000 queries in 7683 ms => 5467 rps
    Check the answers...
    All answers is OK

  RPS for reading increased almost twice!

  According to the tables `debug/24aug-stats-express.txt` and `debug/24aug-stats-custom-server.txt`, the result sending speed has increased at least twice. Look at the `get_collection_(send|result)` and similar lines.

	**Actual speed increase** is from ~1900 s to ~550.

17. Optimizing collection join

  First, rewriting to the following didn't help.

    function getPropMap (collection, prop) {
      return collection.reduce((map, cur) => {
        if (map[cur[prop]]) {
          map[cur[prop]].push(cur)
        } else {
          map[cur[prop]] = [cur]
        }
        return map
      }, {})
    }

    function innerJoin (left, right, leftProp, rightProp) {
      const leftMap = getPropMap(left, leftProp)
      const rightMap = getPropMap(right, rightProp)

      let joined = []
      for (id in leftMap) {
        if (!rightMap[id]) {
          continue
        }

        for (let i = 0; i < leftMap[id].length; i++) {
          joined.push(Object.assign({}, leftMap[id][i], rightMap[id][0]))
        }
      }

      return joined
    }

    module.exports = innerJoin

  With the complexity of O(~3n) it still worked rather slow. Maybe I'm missing something or just wrong in calculating the complexity.

  However, the next attempt to rewrite `innerJoin` function from:

    function innerJoin (left, right, leftProp, rightProp) {
      return left.map(leftItem => {
        let rightItem = right.find(rightItem => rightItem[rightProp] === leftItem[leftProp])
        if (rightItem) {
          return Object.assign({}, leftItem, rightItem)
        }
      }).filter(item => Boolean(item))
    }

    module.exports = innerJoin

  to:

    function innerJoin (left, right, leftProp, rightProp) {
      const rightMap = right.reduce((map, cur) => {
        map[cur[rightProp]] = cur
        return map
      }, {})

      return left.map(leftItem => {
        let rightItem = rightMap[leftItem[leftProp]]
        if (rightItem) {
          return Object.assign({}, leftItem, rightItem)
        }
      }).filter(item => Boolean(item))
    }

    module.exports = innerJoin

  did help! The rule of a thumb will be to get rid of inner looping, which is `right.find` in the above case.

  The execution time dropped by about 5 times.

           ║ key                           │ mean      │ median    │ 95p       │ 99p       │ count ║
    Before ║ get_avg_join                  │ 0.178     │ 0.068     │ 0.654     │ 1.177     │ 3316  ║
    After  ║ get_avg_join                  │ 0.030     │ 0.015     │ 0.122     │ 0.204     │ 3316  ║

    Before ║ get_visits_join               │ 0.142     │ 0.068     │ 0.509     │ 0.845     │ 6666  ║
    After  ║ get_visits_join               │ 0.020     │ 0.005     │ 0.083     │ 0.143     │ 6666  ║
