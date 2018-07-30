const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const snapshotProduct = require('./snapshots/snapshotProduct');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

async function loadProduct(id) {
    const result = await documentClient.get({
        TableName: productsTableName,
        Key: {id}
    }).promise();
    return result.Item;
}

async function setDeleted(id, lastModified) {
    try {
        const newLastModified = (new Date(Date.now())).toISOString();
        await documentClient.update({
            TableName: productsTableName,
            Key: {
                id
            },
            ConditionExpression: 'lastModified = :lastModified',
            UpdateExpression: 'set deleted=:deleted, lastModified=:newLastModified',
            ExpressionAttributeValues: {
                ':lastModified': lastModified,
                ':deleted': true,
                ':newLastModified': newLastModified
            }
        }).promise();
    } catch (e) {
        if (e.name === 'ConditionalCheckFailedException') {
            return 409;
        }
        throw e;
    }
    return 204;
}

module.exports = async function(ctx) {
    const id = ctx.params.id;
    const product = await loadProduct(id);
    await snapshotProduct({...product});
    const lastModified = product.lastModified;

    ctx.status = await setDeleted(id, lastModified);
};