const proxyquire = require('proxyquire');

describe('products', function () {
    describe('listSnapshots', function () {
        beforeEach(function () {
            process.env.PRODUCTS_SNAPSHOT_TABLE_NAME = 'ProductSnapshots';

            this.response = {
                Items: [{},{}]
            }

            this.context = {
                params: {
                    id: 'abc123'
                },
                query: {},
                response: {
                    headers: {},
                    set(field, value) {
                        this.headers[field] = value;
                    }
                }
            };

            this.awsResult = {
                promise: () => Promise.resolve(this.response)
            };
            const documentClient = this.documentClient = {
                query: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'query').and.callThrough();

            this.listSnapshots = proxyquire('./listSnapshots', {
                'aws-sdk': {
                    DynamoDB: {
                        DocumentClient: function() {
                            return documentClient;
                        }
                    }
                }
            });
        });

        it('should pass the correct parameter structure to dyanmodb.scan', async function () {
            this.context.params.id = 'abc123';
            await this.listSnapshots(this.context);
            const expectedParams = {
                ExclusiveStartKey: undefined,
                Limit: 25,
                TableName: 'ProductSnapshots',
                KeyConditionExpression: 'id = :id',
                ExpressionAttributeValues: {
                    ':id': 'abc123'
                },
                ScanIndexForward: false
            };
            expect(this.documentClient.query.calls.argsFor(0)[0]).toEqual(expectedParams);
        });

        it('should return the product list', async function() {
            await this.listSnapshots(this.context);
            expect(this.context.body).toEqual(this.response.Items);
        });

        describe('pagination', function() {
            it('should not return a Link header if the returned LastEvaluatedKey is undefined', async function() {
                delete this.response.LastEvaluatedKey;
                await this.listSnapshots(this.context);
                expect(this.context.response.headers.Link).toBeUndefined();
            });

            it('should return a properly formatted link header when LastEvaluatedKey is returned', async function() {
                this.response.LastEvaluatedKey = {
                    id: 'id123'
                };
                await this.listSnapshots(this.context);
                expect(this.context.response.headers.link)
                    .toEqual('</products?_lek=id123>; rel="next"');
            });

            it('should pass the _lek param to Dyanmo if this is a pagination request', async function() {
                this.context.query = {
                    _lek: 'key123'
                };
                await this.listSnapshots(this.context);
                expect(this.documentClient.query.calls.argsFor(0)[0].ExclusiveStartKey)
                    .toEqual({id: 'key123'});
            });
        });
    });
});