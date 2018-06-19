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
            const documentClient = this.documentClient ={
                delete: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'delete').and.callThrough();

            this.broadcastProductEvent = () => Promise.resolve();
            spyOn(this, 'broadcastProductEvent').and.callThrough();

            this.deleteProduct = proxyquire('./deleteProduct', {
                'aws-sdk': {
                    DynamoDB: {
                        DocumentClient: function() {
                            return documentClient;
                        }
                    }
                },
                './broadcastProductEvent': this.broadcastProductEvent                
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

        it('should call broadcastProductEvent with the id', async function() {
            this.context.params.id = 'abc';
            await this.deleteProduct(this.context);
            expect(this.broadcastProductEvent).toHaveBeenCalledWith('abc');
        });

        it('should set the status to 204 (no content)', async function (){
            await this.deleteProduct(this.context);
            expect(this.context.status).toEqual(204);
        });
    });
});