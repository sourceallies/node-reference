'use strict';

const fetch = require('node-fetch');
const url = require('url');

describe('/products', function() {

    beforeEach(function() {
        this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
    });

    it('should save a new product', async function() {
        let product = {
            name: 'test product',
            imageURL: 'http://example.com/image.jpg'
        };
        let response = await fetch(url.resolve(this.baseURL, 'products'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });

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