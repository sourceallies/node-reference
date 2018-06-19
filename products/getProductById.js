'use strict';

const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function(ctx) {
    let id = ctx.params.id;
    const result = await documentClient.get({
        TableName: productsTableName,
        Key: {id}
    }).promise();

    ctx.body = result.Item;
};