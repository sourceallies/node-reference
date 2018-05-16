'use strict';

const documentClient = require('./documentClient');
const validateProduct = require('./validateProduct');
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
    await saveProduct(product, ctx.segment);
    ctx.body = product;
};

async function saveProduct(product, segment) {
    return await documentClient.put({
        Segment: segment,
        TableName: productsTableName,
        Item: product
    }).promise();
}