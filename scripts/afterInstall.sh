#!/bin/bash
cd /home/ubuntu/csye6225-webapp
ls -al
sudo chown -R ubuntu:ubuntu webapp
sudo rm -r /home/ubuntu/csye6225-webapp/webapp/config
sudo cp -r /home/ubuntu/webapp/config /home/ubuntu/csye6225-webapp/webapp
cd /home/ubuntu/csye6225-webapp/webapp
ls -al
sudo npm install forever -g
sudo npm install -g forever-service
sudo npm install
sudo forever-service install test



