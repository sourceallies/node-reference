'use strict';

const documentClient = require('./documentClient');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function getProductList(ctx) {
    const scanOutput = await documentClient.scan({
        Segment: ctx.segment,
        TableName: productsTableName
    }).promise();

    ctx.body = scanOutput.Items;
};