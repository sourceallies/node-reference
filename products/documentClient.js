
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

const dynamoDB = AWSXRay.captureAWSClient(new AWS.DynamoDB());

module.exports = new AWS.DynamoDB.DocumentClient({
    service: dynamoDB
});