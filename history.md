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
