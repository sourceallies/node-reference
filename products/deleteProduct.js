'use strict';

const documentClient = require('./documentClient');
const broadcastProductEvent = require('./broadcastProductEvent');
const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'Products';

module.exports = async function(ctx) {
    let id = ctx.params.id;
    const result = await documentClient.delete({
        TableName: productsTableName,
        Key: {id}
    }).promise();

    await broadcastProductEvent(id);    
    ctx.status = 204;
};