

const express = require('express');
const app = express();
const bodyParser = require('body-parser')

function helloWorld(req, res) {
    res.send("hello world");
}

app.use(bodyParser.json());

app.get('/', helloWorld);

app.route('/products')
    .post(require('./products/postProduct'))
    .get(require('./products/getProductList'));

    
app.listen(3000, () => {
    console.log("Listening");
});