'use strict';

const documentClient = require('./documentClient');
const validateProduct = require('./validateProduct');
const jsonPatch = require('fast-json-patch');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function(ctx) {
    let id = ctx.params.id;
    let product = await getProduct(id);
    jsonPatch.applyPatch(product, ctx.request.body);

    const validationErrors = validateProduct(product);
    if (validationErrors) {
        ctx.body = validationErrors;
        ctx.status = 400;
        return;
    }

    await saveProduct(product)
    ctx.body = product;
};

async function getProduct(id) {
    const result = await documentClient.get({
        TableName: productsTableName,
        Key: {id}
    }).promise();
    return result.Item;
}

async function saveProduct(product) {
    return await documentClient.put({
        TableName: productsTableName,
        Item: product
    }).promise();
}