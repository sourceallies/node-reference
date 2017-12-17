
const AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-1",
    accessKeyId: 'abc',
    secretAccessKey: 'abc',
    endpoint: "http://localhost:8000"
});

const dynamodb = new AWS.DynamoDB();

const params = {
    TableName: "Products",
    KeySchema: [
        { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function (err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});