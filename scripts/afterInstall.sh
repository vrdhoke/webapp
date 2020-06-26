#!/bin/bash
rm -r /home/ubuntu/csye6225-webapp/webapp/config
cp -r /home/ubuntu/webapp/config /home/ubuntu/csye6225-webapp/webapp
cd /home/ubuntu/csye6225-webapp/webapp
npm install forever -g
npm install