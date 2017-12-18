'use strict';

const proxyquire = require('proxyquire');

describe('products', function () {

    describe('getProductList', function () {

        beforeEach(function () {
            this.response = {
                Items: [{},{}]
            }

            this.res = {
                json: (obj) => { }
            };
            spyOn(this.res, 'json').and.callThrough();

            this.awsResult = {
                promise: () => Promise.resolve(this.response)
            };
            this.documentClient = {
                scan: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'scan').and.callThrough();

            this.getProductList = proxyquire('./getProductList', {
                "./documentClient": this.documentClient
            });
        });

        it('should pass the correct TableName to documentClient.scan', async function () {
            await this.getProductList(this.req, this.res);
            expect(this.documentClient.scan.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should write the product list to res.json', async function () {
            await this.getProductList(this.req, this.res);
            expect(this.res.json).toHaveBeenCalledWith(this.response.Items);
        });
    });
});