
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const productsSnapshotTableName = process.env.PRODUCTS_SNAPSHOT_TABLE_NAME;

module.exports = async function snapshotProduct(product) {
    return await documentClient.put({
        TableName: productsSnapshotTableName,
        Item: product,
    }).promise();
};