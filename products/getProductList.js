'use strict';

const documentClient = require('./documentClient');

module.exports = async function getProductList(req, res) {
    try {
        console.log('listing products');
        const scanOutput = await documentClient.scan({
            TableName: "Products"
        }).promise();

        res.json(scanOutput.Items);
    } catch (e) {
        res.error(e);
    }
};