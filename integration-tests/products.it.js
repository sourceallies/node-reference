
const fetch = require('node-fetch');
const url = require('url');
const getAuthorizationHeader = require('./getAuthorizationHeader');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

describe('/products', function() {
    describe('saving a product', function() {
        beforeAll(async function createNewProduct() {
            this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
            // const authHeader = await getAuthorizationHeader();
            
            const product = {
                name: 'test product',
                imageURL: 'http://example.com/image.jpg'
            };
            console.log('posting', JSON.stringify(product));
            this.response = await fetch(url.resolve(this.baseURL, 'products'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': undefined //sauthHeader
                },
                body: JSON.stringify(product)
            });
            this.responseBody = this.response.ok && await this.response.json();
            console.log('Response ', this.responseBody);
        });

        it('should return an ok status code', function() {
            expect(this.response.status).toEqual(200);
        });

        it('should return an object', function () {
            expect(this.responseBody).toEqual(jasmine.any(Object));
        });

        it('should assign a product id', function (){
            expect(this.responseBody.id).toBeDefined();
        });

        it('should return the name', function () {
            expect(this.responseBody.name).toEqual('test product');
        });
        
        it('should return the imageURL', function () {
            expect(this.responseBody.imageURL).toEqual('http://example.com/image.jpg');
        });
    });
});