const proxyquire = require('proxyquire');

describe('products', function () {
    describe('createProduct', function () {

        beforeEach(function () {
            this.product = {
                name: 'widget',
                imageURL: 'https://example.com/widget.jpg'
            };

            this.context = {
                request: {
                    body: this.product
                }
            };
            
            this.validateProduct = (product) => undefined;
            spyOn(this, 'validateProduct').and.callThrough();

            this.awsResult = {
                promise: () => Promise.resolve()
            };
            this.documentClient = {
                put: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'put').and.callThrough();

            this.createProduct = proxyquire('./createProduct', {
                "./documentClient": this.documentClient,
                './validateProduct': this.validateProduct,
            });
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        it('should pass the correct TableName to documentClient.put', async function () {
            await this.createProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should pass the postedProduct to documentClient.put', async function () {
            await this.createProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item).toBe(this.product);
        });

        it('should set the product as the body', async function () {
            await this.createProduct(this.context);
            expect(this.context.body).toBe(this.product);
        });

        it('should populate an id on the product', async function () {
            await this.createProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item.id).toBeDefined();
        });

        it('should populate the lastModified field', async function () {
            jasmine.clock().mockDate(new Date(Date.UTC(2018, 03, 05, 06, 07, 08, 100)));
            await this.createProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item.lastModified).toEqual('2018-04-05T06:07:08.100Z');
        });

        it('should return validation errors as the body if validation fails', async function(){
            let errors = {"name": []};
            this.validateProduct.and.returnValue(errors);
            await this.createProduct(this.context);
            expect(this.context.body).toBe(errors);
        });

        it('should set status to 400 if validation fails', async function(){
            let errors = {"name": []};
            this.validateProduct.and.returnValue(errors);
            await this.createProduct(this.context);
            expect(this.context.status).toEqual(400);
        });

        it('should not save the product if validation fails', async function(){
            let errors = {"name": []};
            this.validateProduct.and.returnValue(errors);
            await this.createProduct(this.context);
            expect(this.documentClient.put).not.toHaveBeenCalled();
        });
    });
});