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
            this.documentClient = {
                get: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'get').and.callThrough();

            this.getProductById = proxyquire('./getProductById', {
                "./documentClient": this.documentClient
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

        it('should pass the current segment to documentClient.get', async function() {
            const seg = {};
            this.context.segment = seg;
            await this.getProductById(this.context);
            expect(this.documentClient.get.calls.argsFor(0)[0].Segment).toBe(seg);
        });

        it('should return the product', async function () {
            await this.getProductById(this.context);
            expect(this.context.body).toEqual(this.response.Item);
        });
    });
});