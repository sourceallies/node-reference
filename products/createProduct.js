const shortid = require('shortid');
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const productsTableName = process.env.PRODUCTS_TABLE_NAME;

module.exports = async function createProduct(ctx) {
    const product = ctx.request.body;

    product.id = shortid.generate();
    product.lastModified = (new Date(Date.now())).toISOString();
    await saveProduct(product);
    ctx.body = product;
};

async function saveProduct(product) {
    return await documentClient.put({
        TableName: productsTableName,
        Item: product
    }).promise();
}