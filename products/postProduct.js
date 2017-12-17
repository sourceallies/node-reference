'use strict';

const documentClient = require('./documentClient');

module.exports = async function postProduct(req, res) {
    try {
        const product = req.body;
        console.log('posting product', product);
        const params = {
            TableName: "Products",
            Item: product
        };
        await documentClient.put(params).promise();
        res.json(product)
    } catch (e) {
        res.error(e);
    }
};