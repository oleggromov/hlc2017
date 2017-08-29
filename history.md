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

  It didn't affect RPS significantly during local test launches.

18. With huge data files the application just dies

  Part of log:

    client_8256_1 |FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
    client_8256_1 |client_8256_1 |<--- Last few GCs --->
    client_8256_1 |client_8256_1 |[9:0x3d62c00] 1179302 ms: Mark-sweep 1406.1 (1970.1) -> 1394.0 (1968.9) MB, 11111.1 / 0.0 ms allocation failure GC in old space requested
    client_8256_1 |[9:0x3d62c00] 1190680 ms: Mark-sweep 1394.0 (1968.9) -> 1393.8 (1969.9) MB, 11377.8 / 0.0 ms allocation failure GC in old space requested
    client_8256_1 |[9:0x3d62c00] 1202724 ms: Mark-sweep 1393.8 (1969.9) -> 1393.8 (1938.4) MB, 12044.0 / 0.0 ms last resort
    client_8256_1 |[9:0x3d62c00] 1213806 ms: Mark-sweep 1393.8 (1938.4) -> 1393.8 (1938.4) MB, 11080.6 / 0.0 ms last resort
    client_8256_1 |client_8256_1 |client_8256_1 |<--- JS stacktrace --->
    client_8256_1 |client_8256_1 |==== JS stack trace =========================================
    client_8256_1 |client_8256_1 |Security context: 0x11d2a599cef1 <JSObject>
    client_8256_1 |2: stringSlice(aka stringSlice) [buffer.js:556] [bytecode=0x2293d0046051 offset=96](this=0x11d2a5982241 <undefined>,buf=0x156751902329 <Uint8Array map = 0x30522c143969>,encoding=0x11d2a59fdad1 <String[4]: utf8>,start=0,end=8934690)
    client_8256_1 |4: toString [buffer.js:629] [bytecode=0x2293d0045c89 offset=148](this=0x156751902329 <Uint8Array map = 0x30522c143969>,encoding=0x11d2a59fdad1 <String[4]: utf...
    client_8256_1 |client_8256_1 |1: node::Abort() [node]
    client_8256_1 |2: 0x13c7b5c [node]
    client_8256_1 |3: v8::Utils::ReportOOMFailure(char const*, bool) [node]
    client_8256_1 |4: v8::internal::V8::FatalProcessOutOfMemory(char const*, bool) [node]
    client_8256_1 |5: v8::internal::Factory::NewRawOneByteString(int, v8::internal::PretenureFlag) [node]
    client_8256_1 |6: v8::internal::Factory::NewStringFromOneByte(v8::internal::Vector<unsigned char const>, v8::internal::PretenureFlag) [node]
    client_8256_1 |7: v8::internal::Factory::NewStringFromUtf8(v8::internal::Vector<char const>, v8::internal::PretenureFlag) [node]
    client_8256_1 |8: v8::String::NewFromUtf8(v8::Isolate*, char const*, v8::NewStringType, int) [node]
    client_8256_1 |9: node::StringBytes::Encode(v8::Isolate*, char const*, unsigned long, node::encoding, v8::Local<v8::Value>*) [node]
    client_8256_1 |10: 0x13e931b [node]
    client_8256_1 |11: v8::internal::FunctionCallbackArguments::Call(void (*)(v8::FunctionCallbackInfo<v8::Value> const&)) [node]
    client_8256_1 |12: 0xba5d81 [node]
    client_8256_1 |13: v8::internal::Builtin_HandleApiCall(int, v8::internal::Object**, v8::internal::Isolate*) [node]
    client_8256_1 |14: 0x450ee840dd
    client_8256_1 |Aborted

  Apparently, I have to start using streamed input. The question is, how to parse chunked JSON data and what would be the chunks actually.

