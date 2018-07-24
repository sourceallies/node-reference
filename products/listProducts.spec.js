const proxyquire = require('proxyquire');

describe('products', function () {
    describe('listProducts', function () {
        beforeEach(function () {
            this.response = {
                Items: [{},{}]
            }

            this.context = {
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
                scan: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'scan').and.callThrough();

            this.listProducts = proxyquire('./listProducts', {
                'aws-sdk': {
                    DynamoDB: {
                        DocumentClient: function() {
                            return documentClient;
                        }
                    }
                }
            });
        });

        it('should pass the correct TableName to documentClient.scan', async function () {
            await this.listProducts(this.context);
            expect(this.documentClient.scan.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should return the product list', async function() {
            await this.listProducts(this.context);
            expect(this.context.body).toEqual(this.response.Items);
        });

        it('should limit the scan to 25 items', async function() {
            await this.listProducts(this.context);
            expect(this.documentClient.scan.calls.argsFor(0)[0].Limit).toEqual(25);
        });

        describe('pagination', function() {
            it('should not return a Link header if the returned LastEvaluatedKey is undefined', async function() {
                delete this.response.LastEvaluatedKey;
                await this.listProducts(this.context);
                expect(this.context.response.headers.Link).toBeUndefined();
            });
        
            it('should return a properly formatted link header when LastEvaluatedKey is returned', async function() {
                this.response.LastEvaluatedKey = {
                    id: 'id123'
                };
                await this.listProducts(this.context);
                expect(this.context.response.headers.link)
                    .toEqual('</products?_lek=id123>; rel="next"');
            });
        
            it('should pass the _lek param to Dyanamo if this is a pagination request', async function() {
                this.context.query = {
                    _lek: 'key123'
                };
                await this.listProducts(this.context);
                expect(this.documentClient.scan.calls.argsFor(0)[0].ExclusiveStartKey)
                    .toEqual({id: 'key123'});
            });
        });
    });
});