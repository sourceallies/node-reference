'use strict';

const documentClient = require('./documentClient');
const shortid = require('shortid');

module.exports = async function postProduct(req, res) {
    try {
        const product = req.body;
        product.id = shortid.generate();
        console.log('posting product', product);
        await documentClient.put({
            TableName: "Products",
            Item: product
        }).promise();
        
        res.json(product)
    } catch (e) {
        res.error(e);
    }
};