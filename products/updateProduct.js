
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const validateProduct = require('./validateProduct');
const snapshotProduct = require('./snapshots/snapshotProduct');
const broadcastProductEvent = require('./broadcastProductEvent');
const jsonPatch = require('fast-json-patch');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

async function loadProduct(id) {
    const result = await documentClient.get({
        TableName: productsTableName,
        Key: {id}
    }).promise();

    return result.Item;
}

function validatePatchDocument(patchDocument) {
    const patchErrors = jsonPatch.validate(patchDocument);
    if (patchErrors) {
        return {
            status: 400
        }
    }
}

function applyPatchDocument(product, patchDocument) {
    try {
        jsonPatch.applyPatch(product, patchDocument);
    } catch (e) {
        if (e.name === 'TEST_OPERATION_FAILED') {
            return {
                body: e.operation,
                status: 409
            };
        }
        throw e;
    }
}

function validatePatchedDocument(product) {
    const validationErrors = validateProduct(product);
    if (validationErrors) {
        return {
            body: validationErrors,
            status: 400
        };
    }
}

async function saveProduct(product, lastModified) {
    product.lastModified = (new Date(Date.now())).toISOString();
    try {
        await documentClient.put({
            TableName: productsTableName,
            Item: product,
            ConditionExpression: 'lastModified = :lastModified',
            ExpressionAttributeValues: {
                ':lastModified': lastModified
            }
        }).promise();
    } catch (e) {
        if (e.name === 'ConditionalCheckFailedException') {
            return {
                status: 409
            };
        }
        throw e;
    }

    return {
        status: 200,
        body: product
    };
}

module.exports = async function(ctx) {
    const id = ctx.params.id;
    const patchDocument = ctx.request.body;
    const product = await loadProduct(id);
    if (product.deleted) {
        ctx.status = 410;
        return;
    }

    await Promise.all([
        snapshotProduct({...product}),
        broadcastProductEvent(product.id)
    ]);
    const lastModified = product.lastModified;

    const response = validatePatchDocument(patchDocument) ||
        applyPatchDocument(product, patchDocument) ||
        validatePatchedDocument(product) ||
        await saveProduct(product, lastModified);

    ctx.body = response.body;
    ctx.status = response.status;
};