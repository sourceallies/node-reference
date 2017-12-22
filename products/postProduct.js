'use strict';

const documentClient = require('./documentClient');
const shortid = require('shortid');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function postProduct(context) {
    const product = context.request.body;
    product.id = shortid.generate();
    console.log('posting product', product);
    await saveProduct(product);
    return product;
};

async function saveProduct(product) {
    return await documentClient.put({
        TableName: productsTableName,
        Item: product
    }).promise();
}