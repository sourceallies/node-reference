
const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');

if (!process.env.PRODUCTS_TABLE_NAME) {
    AWS.config.update({
        secretAccessKey: 'abc',
        accessKeyId: 'abc',
        region: "us-east-1",
        endpoint: "http://localhost:8000"
    });
}

const documentClient = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(documentClient.service);

module.exports = documentClient;