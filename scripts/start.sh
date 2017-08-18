#!/bin/bash

docker rm $(docker ps -aq --filter name=hlc)
docker run --name hlc -v /Users/gromych/home_projects/hlc2017/data:/tmp/data -p 3000:80 hlc2017
