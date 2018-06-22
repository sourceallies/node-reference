const fetch = require('node-fetch');
const url = require('url');

describe('/products', function() {
    describe('saving a product', function() {
        beforeAll(async function() {
            this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
    
            // let client_id = 'avg0fvfjnfqlhdst57ibrgbi4';
            // let client_secret = '1dgf6295bp6onh5jg34re0sa6n2v0i5rlnac4ihiblfrcdfj8dvr';
            // let encodedClientCredentials = new Buffer(`${client_id}:${client_secret}`).toString('base64');
            // const tokenBody = await fetch('https://prowe-products.auth.us-east-1.amazoncognito.com/oauth2/token', {
            //     method: 'POST',
            //     body: 'grant_type=client_credentials',
            //     headers: {
            //         'Authorization': `Basic ${encodedClientCredentials}`,
            //         'Content-Type': 'application/x-www-form-urlencoded'
            //     }
            // }).then(r => r.json());
            // this.authHeader = `Bearer ${tokenBody.access_token}`;
    
            const product = {
                name: 'test product',
                imageURL: 'http://example.com/image.jpg'
            };
            console.log('posting', JSON.stringify(product));
            this.response = await fetch(url.resolve(this.baseURL, 'products'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.authHeader
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