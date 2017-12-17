#!/bin/bash

set -e

if [ -z "$(ls -A ./dynamoDB 2>/dev/null)" ]; then
    echo "dynamoDB does not exist. downloading"
    mkdir -p ./dynamoDB
    curl --silent https://s3-us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz | tar xvz -C dynamoDB
fi

java \
    -Djava.library.path=./dynamoDB/DynamoDBLocal_lib \
    -jar dynamoDB/DynamoDBLocal.jar \
    -inMemory \
    -sharedDb
