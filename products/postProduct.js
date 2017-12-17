const documentClient = require('documentClient');

module.exports = function postProduct(req, res) {
    const product = req.body;
    console.log('posting product', product);
    let params = {
        TableName: "Products",
        Item: product
    };
    return documentClient.put(params).promise()
        .then(r => res.json(product))
        .catch(e => res.error(e));
};