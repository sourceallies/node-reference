'use strict';

const documentClient = require('./documentClient');
const shortid = require('shortid');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function postProduct(ctx) {
    const product = ctx.request.body;
    product.id = shortid.generate();
    console.log('posting product', product);
    await saveProduct(product);
    ctx.body = product;
};

async function saveProduct(product) {
    return await documentClient.put({
        TableName: productsTableName,
        Item: product
    }).promise();
}