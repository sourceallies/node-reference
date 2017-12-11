
module.exports = function postProduct(req, res) {
    const product = req.body;
    console.log('posting product', product);

    res.json(product);
};