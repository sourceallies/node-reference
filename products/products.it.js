'use strict';

const fetch = require('node-fetch');
const url = require('url');

describe('/products', function() {

    beforeAll(async function() {
        this.baseURL = process.env.BASE_URL || 'http://localhost:3000';

        let client_id = 'avg0fvfjnfqlhdst57ibrgbi4';
        let client_secret = '1dgf6295bp6onh5jg34re0sa6n2v0i5rlnac4ihiblfrcdfj8dvr';
        let encodedClientCredentials = new Buffer(`${client_id}:${client_secret}`).toString('base64');
        const tokenBody = await fetch('https://prowe-products.auth.us-east-1.amazoncognito.com/oauth2/token', {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                'Authorization': `Basic ${encodedClientCredentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(r => r.json());
        this.authHeader = `Bearer ${tokenBody.access_token}`;
    });

    it('should save a new product', async function() {
        let product = {
            name: 'test product',
            imageURL: 'http://example.com/image.jpg'
        };
        let response = await fetch(url.resolve(this.baseURL, 'products'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.authHeader
            },
            body: JSON.stringify(product)
        });

        console.log('posting', JSON.stringify(product));

        expect(response.ok).toEqual(true);
        expect(response.status).toEqual(200);

        let responseProduct = await response.json();
        console.log('Response ', responseProduct);
        expect(responseProduct).toBeDefined();
        let productId = responseProduct.id;
        expect(productId).toBeDefined();
        expect(responseProduct.name).toEqual(product.name);
        expect(responseProduct.imageURL).toEqual(product.imageURL);
    });
});