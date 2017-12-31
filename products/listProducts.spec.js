'use strict';

const proxyquire = require('proxyquire');

describe('products', function () {

    describe('listProducts', function () {

        beforeEach(function () {
            this.response = {
                Items: [{},{}]
            }

            this.context = {};

            this.awsResult = {
                promise: () => Promise.resolve(this.response)
            };
            this.documentClient = {
                scan: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'scan').and.callThrough();

            this.listProducts = proxyquire('./listProducts', {
                "./documentClient": this.documentClient
            });
        });

        it('should pass the correct TableName to documentClient.scan', async function () {
            await this.listProducts(this.context);
            expect(this.documentClient.scan.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should pass the current segment to documentClient.scan', async function() {
            const seg = {};
            this.context.segment = seg;
            await this.listProducts(this.context);
            expect(this.documentClient.scan.calls.argsFor(0)[0].Segment).toBe(seg);
        });

        it('should return the product list', async function () {
            await this.listProducts(this.context);
            expect(this.context.body).toEqual(this.response.Items);
        });
    });
});