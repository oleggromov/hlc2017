FROM phusion/baseimage:0.9.22

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

# creating directories
RUN mkdir -p /usr/src/app
RUN mkdir -p /usr/src/app/src/data
WORKDIR /usr/src/app

# copying app sources
COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app
COPY src/*.js /usr/src/app/src/

# installing node 8.x
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
# ... and unzip
RUN apt-get install unzip

# ... and dependencies
RUN npm install

# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

EXPOSE 80
# Unpack data and run node
CMD unzip /tmp/data/data.zip -d /usr/src/app/src/data \
	&& node src/index.js
