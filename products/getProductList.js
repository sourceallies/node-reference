'use strict';

const documentClient = require('./documentClient');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function getProductList(ctx) {
    console.log('listing products');
    const scanOutput = await documentClient.scan({
        TableName: productsTableName
    }).promise();

    return scanOutput.Items;
};