
const documentClient = require('../documentClient');
const formatLinkHeader = require('format-link-header');
const productsSnapshotTableName = process.env.PRODUCTS_SNAPSHOT_TABLE_NAME;

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

module.exports = async function listSnapshots(ctx) {
    const scanOutput = await documentClient.query({
        TableName: productsSnapshotTableName,
        Limit: 25,
        ExclusiveStartKey: getExclusiveStartKey(ctx),
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
            ':id': ctx.params.id
        },
        ScanIndexForward: false
    }).promise();

    addLinkHeaderIfNeeded(ctx, scanOutput.LastEvaluatedKey);
    ctx.body = scanOutput.Items;
};