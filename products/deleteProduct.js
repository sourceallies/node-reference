'use strict';

const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const broadcastProductEvent = require('./broadcastProductEvent');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function(ctx) {
    let id = ctx.params.id;
    const result = await documentClient.delete({
        TableName: productsTableName,
        Key: {id}
    }).promise();

    await broadcastProductEvent(id);    
    ctx.status = 204;
};