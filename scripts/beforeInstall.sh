#!/bin/bash

# processId=$(lsof -i tcp:3000 | grep 'node' | grep -v 'grep' | awk '{ printf $2 }')
# echo $processId
# # processId = lsof -i tcp:3000
# kill  $processId

# processId=$(ps -ef | grep 'nodemon' | grep -v 'grep' | awk '{ printf $2 }')
# echo $processId
# # processId = lsof -i tcp:3000
# kill $processId