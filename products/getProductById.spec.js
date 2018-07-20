'use strict';

const proxyquire = require('proxyquire');

describe('products', function () {

    describe('getProductById', function () {

        beforeEach(function () {
            this.response = {
                Item: {}
            }

            this.context = {
                params: {}
            };

            this.awsResult = {
                promise: () => Promise.resolve(this.response)
            };
            const documentClient = this.documentClient ={
                get: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'get').and.callThrough();

            this.getProductById = proxyquire('./getProductById', {
                'aws-sdk': {
                    DynamoDB: {
                        DocumentClient: function() {
                            return documentClient;
                        }
                    }
                }
            });
        });

        it('should pass the correct TableName to documentClient.get', async function () {
            await this.getProductById(this.context);
            expect(this.documentClient.get.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should pass the id to documentClient.get', async function() {
            this.context.params.id = 'abc';
            await this.getProductById(this.context);
            expect(this.documentClient.get.calls.argsFor(0)[0].Key.id).toEqual('abc');
        });

        it('should return the product', async function () {
            await this.getProductById(this.context);
            expect(this.context.body).toEqual(this.response.Item);
        });

        it('should return a 404 if the product does not exist', async function () {
            delete this.response.Item;

            await this.getProductById(this.context);

            expect(this.context.status).toEqual(404);
        });

        it('should return a 410 if the product has been deleted', async function () {
            this.response.Item.deleted = true;

            await this.getProductById(this.context);

            expect(this.context.status).toEqual(410);
        });
    });
});