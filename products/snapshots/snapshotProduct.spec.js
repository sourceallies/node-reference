const proxyquire = require('proxyquire');

describe('products', function () {
    describe('snapshotProduct', function () {
        beforeEach(function () {
            process.env.PRODUCTS_SNAPSHOT_TABLE_NAME = 'ProductSnapshots';
            this.product = {
                id: 'abc',
                lastModified: '2018-04-03T10:00:00.000Z'
            };

            this.awsResult = {
                promise: () => Promise.resolve()
            };
            const documentClient = this.documentClient ={
                put: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'put').and.callThrough();

            this.snapshotProduct = proxyquire('./snapshotProduct', {
                'aws-sdk': {
                    DynamoDB: {
                        DocumentClient: function() {
                            return documentClient;
                        }
                    }
                }
            });
        });

        it('should pass the correct TableName to documentClient.put', async function () {
            await this.snapshotProduct(this.product);
            expect(this.documentClient.put.calls.argsFor(0)[0].TableName).toEqual('ProductSnapshots');
        });

        it('should pass the product to documentClient.put', async function () {
            await this.snapshotProduct(this.product);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item).toBe(this.product);
        });
    });
});