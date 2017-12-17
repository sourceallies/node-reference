const AWS = require('aws-sdk');

AWS.config.update({
    secretAccessKey: 'abc',
    accessKeyId: 'abc',
    region: "us-east-1",
    endpoint: "http://localhost:8000"
});

function createProductsTable() {
    const dynamodb = new AWS.DynamoDB();
    var params = {
        TableName: "Products",
        KeySchema: [
            { AttributeName: "id", KeyType: "HASH" }
        ],
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "N" },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2
        }
    };

    dynamodb.createTable(params, function (err, data) {
        if (err) {
            console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}

createProductsTable();
module.exports = new AWS.DynamoDB.DocumentClient();