#!/bin/bash

docker rm $(docker ps -aq --filter name=hlc)
docker run --name hlc -v /Users/gromych/home_projects/hlc2017/data:/tmp/data hlc2017
