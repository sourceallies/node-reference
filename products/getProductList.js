'use strict';

const documentClient = require('./documentClient');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function getProductList(req, res) {
    try {
        console.log('listing products');
        const scanOutput = await documentClient.scan({
            TableName: productsTableName
        }).promise();

        res.json(scanOutput.Items);
    } catch (e) {
        res.error(e);
    }
};