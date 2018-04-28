
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB({
    endpoint: process.env.ENDPOINT
});

const params = {
    TableName: process.env.PRODUCTS_TABLE_NAME,
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

dynamodb.createTable(params)
    .promise()
    .catch(err => {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        process.exit(1);
    })
    .then(data => {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
        process.exit(0);
    });