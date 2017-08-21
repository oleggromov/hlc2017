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

	- Rather complex aggregated requsts are slow because of bad or non-existent binary search indices. Look to
	- posts work rather well

	TODO: think about how to recalculate indices.
