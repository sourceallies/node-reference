const proxyquire = require('proxyquire');

describe('products', function () {
    
    describe('deleteProduct', function () {
        
        beforeEach(function () {
            process.env.PRODUCTS_TABLE_NAME = 'Products';
            this.response = {
            }
            this.getResponse = {
                Item: {
                    lastModified: '2018-01-02T03:04:05.000Z'
                }
            };

            this.context = {
                params: {}
            };

            const documentClient = this.documentClient ={
                get: () => ({
                    promise: () => Promise.resolve(this.getResponse)
                }),
                update: () => ({
                    promise: () => Promise.resolve({})
                })
            };
            spyOn(this.documentClient, 'get').and.callThrough();
            spyOn(this.documentClient, 'update').and.callThrough();

            this.snapshotProduct = (product) => Promise.resolve();
            spyOn(this, 'snapshotProduct');

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
                './snapshots/snapshotProduct': this.snapshotProduct,
                './broadcastProductEvent': this.broadcastProductEvent
            });
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        it('should use the correct parameters to get the current state of the product', async function() {
            this.context.params.id = 'abc';

            await this.deleteProduct(this.context);
            
            const expectedParams = {
                TableName: 'Products',
                Key: {
                    id: 'abc'
                }
            };
            expect(this.documentClient.get.calls.argsFor(0)[0]).toEqual(expectedParams);
        });

        it('should pass the product to snapshotProduct', async function () {
            await this.deleteProduct(this.context);

            expect(this.snapshotProduct.calls.argsFor(0)[0]).toEqual(this.getResponse.Item);
        });

        it('should pass the correct TableName to documentClient.update', async function () {
            await this.deleteProduct(this.context);

            expect(this.documentClient.update.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should pass the id to documentClient.update', async function() {
            this.context.params.id = 'abc';
            await this.deleteProduct(this.context);
            expect(this.documentClient.update.calls.argsFor(0)[0].Key.id).toEqual('abc');
        });

        it('should set the condition expression flag to true', async function() {
            await this.deleteProduct(this.context);

            expect(this.documentClient.update.calls.argsFor(0)[0].UpdateExpression)
                .toEqual('set deleted=:deleted, lastModified=:newLastModified');
        });

        it('should be a conditional update', async function () {
            await this.deleteProduct(this.context);
            expect(this.documentClient.update.calls.argsFor(0)[0].ConditionExpression).toEqual('lastModified = :lastModified');
        });
        
        it('should set the ExpressionAttributeValues', async function() {
            jasmine.clock().mockDate(new Date(Date.UTC(2018, 03, 05, 06, 07, 08, 100)));
            
            await this.deleteProduct(this.context);

            const expectedValues = {
                ':deleted': true,
                ':lastModified': '2018-01-02T03:04:05.000Z',
                ':newLastModified': '2018-04-05T06:07:08.100Z'
            };
            expect(this.documentClient.update.calls.argsFor(0)[0].ExpressionAttributeValues)
                .toEqual(expectedValues);
        });

        it('should set the status to 204 (no content)', async function (){
            await this.deleteProduct(this.context);
            expect(this.context.status).toEqual(204);
        });

        it('should return a 409 status if dynamo throws a constraint exception', async function () {
            const checkFailedError = {
                name: 'ConditionalCheckFailedException'
            };
            this.documentClient.update.and.returnValue({
                promise: () => Promise.reject(checkFailedError)
            });
            await this.deleteProduct(this.context);
            expect(this.context.status).toEqual(409);
        });

        it('should call broadcastProductEvent with the id', async function() {
            await this.deleteProduct(this.context);
            const id = this.documentClient.update.calls.argsFor(0)[0].Key.id;
            expect(this.broadcastProductEvent).toHaveBeenCalledWith(id);
        });
    
        it('should not save if broadcast fails', async function() {
            this.broadcastProductEvent.and.callFake(() => Promise.reject());
            try {
                await this.deleteProduct(this.context);
            } catch(e) {}
            expect(this.documentClient.update).not.toHaveBeenCalled();
        });
    });
});