'use strict';

const documentClient = require('./documentClient');
const shortid = require('shortid');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function postProduct(req, res) {
    try {
        const product = req.body;
        product.id = shortid.generate();
        console.log('posting product', product);
        await documentClient.put({
            TableName: productsTableName,
            Item: product
        }).promise();

        res.json(product);
    } catch (e) {
        res.error(e);
    }
};