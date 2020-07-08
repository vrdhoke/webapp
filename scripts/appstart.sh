#!/bin/bash
sudo service amazon-cloudwatch-agent restart
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/home/ubuntu/csye6225-webapp/webapp/amazon-cloudwatch-agent.json \
    -s
cd /home/ubuntu/csye6225-webapp/webapp
ls -al
sudo kill $(ps -ef | grep webapp/app.js | grep -v 'grep' | awk '{printf $2}')
sudo forever start -a app.js