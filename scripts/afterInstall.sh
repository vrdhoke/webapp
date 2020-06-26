#!/bin/bash
cp -a /home/ubuntu/webapp/config/. /home/ubuntu/csye6225-webapp/webapp/config
cd /home/ubuntu/csye6225-webapp/webapp
npm install forever -g
npm install