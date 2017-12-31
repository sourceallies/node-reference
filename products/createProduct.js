'use strict';

const documentClient = require('./documentClient');
const productValidator = require('./productValidator');
const shortid = require('shortid');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function postProduct(ctx) {
    const product = ctx.request.body;

    const validatonErrors = productValidator.validate(product);
    if (validatonErrors) {
        ctx.body = validatonErrors;
        ctx.status = 400;
        return;
    }

    product.id = shortid.generate();
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