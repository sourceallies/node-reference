const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const formatLinkHeader = require('format-link-header');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

function getExclusiveStartKey(ctx) {
    if (ctx.query && ctx.query._lek) {
        return {
            id: ctx.query._lek
        };
    }
}

function addLinkHeaderIfNeeded(ctx, lastEvaluatedKey) {
    if (lastEvaluatedKey) {
        const link = {
            next: {
                rel: 'next',
                url: `/products?_lek=${lastEvaluatedKey.id}`
            }
        };
        ctx.response.set('link', formatLinkHeader(link));
    }
}

module.exports = async function getProductList(ctx) {
    const scanOutput = await documentClient.scan({
        Segment: ctx.segment,
        TableName: productsTableName,
        Limit: 25,
        ExclusiveStartKey: getExclusiveStartKey(ctx)
    }).promise();

    addLinkHeaderIfNeeded(ctx, scanOutput.LastEvaluatedKey);
    ctx.body = scanOutput.Items;
};