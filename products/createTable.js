
const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB({
    endpoint: process.env.ENDPOINT
});

const tables = [
    {
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
    },
    {
        TableName: process.env.PRODUCTS_SNAPSHOT_TABLE_NAME,
        KeySchema: [
            { AttributeName: "id", KeyType: "HASH" },
            { AttributeName: "lastModified", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "lastModified", AttributeType: "S" }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        }
    }
];

Promise.all(tables.map(async params => {
    try {
        return await dynamodb.createTable(params).promise();
    } catch(e) {
        if(e.code === 'ResourceInUseException') {
            return `${params.TableName} exists`;
        }
        throw e;
    }
}))
    .catch(err => {
        console.error("Unable to create table. Error JSON:", err, JSON.stringify(err, null, 2));
        process.exit(1);
    })
    .then(data => {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
        process.exit(0);
    });