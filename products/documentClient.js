
const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB({
    endpoint: process.env.ENDPOINT
});

const documentClient = new AWS.DynamoDB.DocumentClient(dynamodb);
AWSXRay.captureAWSClient(documentClient.service);

module.exports = documentClient;