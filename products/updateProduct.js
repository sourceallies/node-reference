
const documentClient = require('./documentClient');
const validateProduct = require('./validateProduct');
const jsonPatch = require('fast-json-patch');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

async function loadProduct(id, Segment) {
    const result = await documentClient.get({
        TableName: productsTableName,
        Segment,
        Key: {id}
    }).promise();

    return result.Item;
}

async function saveProduct(product, lastModified, Segment) {
    product.lastModified = (new Date(Date.now())).toISOString();

    await documentClient.put({
        TableName: productsTableName,
        Segment,
        Item: product,
        ConditionExpression: 'lastModified = :lastModified',
        ExpressionAttributeValues: {
            ':lastModified': lastModified
        }
    }).promise();
}

module.exports = async function(ctx) {
    const id = ctx.params.id;
    const patchDocument = ctx.request.body;
    const product = await loadProduct(id, ctx.segment);
    const lastModified = product.lastModified;

    const patchErrors = jsonPatch.validate(patchDocument);
    if(patchErrors) {
        ctx.status = 400;
        return;
    }
    try {
        jsonPatch.applyPatch(product, patchDocument);
    } catch (e) {
        if (e.name === 'TEST_OPERATION_FAILED') {
            ctx.body = e.operation;
            ctx.status = 409;
            return;
        }
        throw e;
    }

    const validationErrors = validateProduct(product);
    if (validationErrors) {
        ctx.body = validationErrors;
        ctx.status = 400;
        return;
    }

    try {
        await saveProduct(product, lastModified, ctx.segment);
    } catch (e) {
        if (e.name === 'ConditionalCheckFailedException') {
            ctx.status = 409;
            return;
        }
        throw e;
    }

    ctx.body = product;
};