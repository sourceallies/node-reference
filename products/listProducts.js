const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function getProductList(ctx) {
    const scanOutput = await documentClient.scan({
        Segment: ctx.segment,
        TableName: productsTableName,
        Limit: 25
    }).promise();

    ctx.body = scanOutput.Items;
};