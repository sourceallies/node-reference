'use strict';

const proxyquire = require('proxyquire');

describe('products', function () {

    describe('deleteProduct', function () {

        beforeEach(function () {
            this.response = {
            }

            this.context = {
                params: {}
            };

            this.awsResult = {
                promise: () => Promise.resolve(this.response)
            };
            this.documentClient = {
                delete: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'delete').and.callThrough();

            this.deleteProduct = proxyquire('./deleteProduct', {
                "./documentClient": this.documentClient
            });
        });

        it('should pass the correct TableName to documentClient.delete', async function () {
            await this.deleteProduct(this.context);
            expect(this.documentClient.delete.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should pass the id to documentClient.delete', async function() {
            this.context.params.id = 'abc';
            await this.deleteProduct(this.context);
            expect(this.documentClient.delete.calls.argsFor(0)[0].Key.id).toEqual('abc');
        });

        it('should set the status to 204 (no content)', async function (){
            await this.deleteProduct(this.context);
            expect(this.context.status).toEqual(204);
        });
    });
});