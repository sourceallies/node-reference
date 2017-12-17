const AWS = require('aws-sdk');

AWS.config.update({
    secretAccessKey: 'abc',
    accessKeyId: 'abc',
    region: "us-east-1",
    endpoint: "http://localhost:8000"
});

module.exports = new AWS.DynamoDB.DocumentClient();