
const proxyquire = require('proxyquire');

describe('products', function () {

    describe('updateProduct', function () {
        beforeEach(function () {
            this.context = {
                params: {
                    id: 'abc'
                },
                request: {
                    body: [
                        {op: 'replace', path: '/name', value: 'new name'}
                    ]
                }
            };
            this.getResponse = {
                Item: {
                    lastModified: '2018-01-02T03:04:05.000Z'
                }
            };
            this.documentClient = {
                get: () => ({
                    promise: () => Promise.resolve(this.getResponse)
                })
            };
            spyOn(this.documentClient, 'get').and.callThrough();

            this.validateProduct = (product) => undefined;
            spyOn(this, 'validateProduct').and.callThrough();

            this.updateProduct = proxyquire('./updateProduct', {
                "./documentClient": this.documentClient,
                './validateProduct': this.validateProduct                
            });
        });

        it('should use the correct parameters to get the current state of the product', function() {
            await this.updateProduct(this.context);
            const expectedParams = {
                TableName: 'Products',
                Key: {
                    id: 'abc'
                }
            };
            expect(this.documentClient.get.calls.argsFor(0)[0]).toEqual(expectedParams);
        });

        it('should validate the patched product', function () {
            this.context.request.body = [
                {op: 'replace', path: '/name', value: 'new name'}
            ];
            await this.updateProduct(this.context);
            expect(this.validateProduct.calls.argsFor(0)[0].name).toEqual('new name')            
        });

        describe('invalid patch document');
        describe('validation fails');
        describe('patch test fails');

        it('should return a 409 statusif dynamo throws a constraint exception')
    });
});