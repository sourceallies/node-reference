'use strict';

const documentClient = require('./documentClient');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = {
    method: 'GET',
    path: '/products',
    handler: getProductList
};

async function getProductList(request, h) {
    const scanOutput = await documentClient.scan({
      //  Segment: ctx.segment,
        TableName: productsTableName
    }).promise();

    return h.response(scanOutput.Items);
};