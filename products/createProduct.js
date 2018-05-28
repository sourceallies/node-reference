'use strict';

const documentClient = require('./documentClient');
const validateProduct = require('./validateProduct');
const broadcastProductEvent = require('./broadcastProductEvent');
const shortid = require('shortid');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function postProduct(ctx) {
    const product = ctx.request.body;

    const validatonErrors = validateProduct(product);
    if (validatonErrors) {
        ctx.body = validatonErrors;
        ctx.status = 400;
        return;
    }

    product.id = shortid.generate();
    product.lastModified = (new Date(Date.now())).toISOString();
    await saveProduct(product);
    await broadcastProductEvent(product.id);    
    ctx.body = product;
};

async function saveProduct(product) {
    return await documentClient.put({
        TableName: productsTableName,
        Item: product
    }).promise();
}