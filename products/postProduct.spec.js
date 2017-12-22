'use strict';

const proxyquire = require('proxyquire');

describe('products', function () {
    describe('postProduct', function () {

        beforeEach(function () {
            this.product = {
                name: 'widget',
                imageURL: 'https://example.com/widget.jpg'
            };

            this.context = {
                request: {
                    body: this.product
                }
            };

            this.awsResult = {
                promise: () => Promise.resolve()
            };
            this.documentClient = {
                put: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'put').and.callThrough();

            this.postProduct = proxyquire('./postProduct', {
                "./documentClient": this.documentClient
            });
        });

        it('should pass the correct TableName to documentClient.put', async function () {
            await this.postProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should pass the postedProduct to documentClient.put', async function () {
            await this.postProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item).toBe(this.product);
        });

        it('should write the product to res.json', async function () {
            let result = await this.postProduct(this.context);
            expect(result).toBe(this.product);
        });

        it('should populate an id on the product', async function () {
            await this.postProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item.id).toBeDefined();
        });
    });
});