const proxyquire = require('proxyquire');

describe('products', function () {
    describe('createProduct', function () {
        beforeEach(function () {
            process.env.PRODUCTS_TABLE_NAME = 'Products';

            this.product = {
                name: 'widget',
                imageURL: 'https://example.com/widget.jpg'
            };

            this.context = {
                request: {
                    body: this.product
                }
            };

            this.awsResult = {
                promise: () => Promise.resolve()
            };
            const documentClient = this.documentClient = {
                put: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'put').and.callThrough();

            this.validateProduct = (product) => undefined;
            spyOn(this, 'validateProduct').and.callThrough();

            this.broadcastProductEvent = () => Promise.resolve();
            spyOn(this, 'broadcastProductEvent').and.callThrough();

            this.createProduct = proxyquire('./createProduct', {
                'aws-sdk': {
                    DynamoDB: {
                        DocumentClient: function() {
                            return documentClient;
                        }
                    }
                },
                './validateProduct': this.validateProduct,
                './broadcastProductEvent': this.broadcastProductEvent
            });
        });

        it('should return validation errors as the body if validation fails', async function(){
            let errors = {name: []};
            this.validateProduct.and.returnValue(errors);
            await this.createProduct(this.context);
            expect(this.context.body).toBe(errors);
        });
        
        it('should set status to 400 if validation fails', async function(){
            this.validateProduct.and.returnValue({name: []});
            await this.createProduct(this.context);
            expect(this.context.status).toEqual(400);
        });
        
        it('should not save the product if validation fails', async function(){
            this.validateProduct.and.returnValue({name: []});
            await this.createProduct(this.context);
            expect(this.documentClient.put).not.toHaveBeenCalled();
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

        it('should call broadcastProductEvent with the id', async function() {
            await this.createProduct(this.context);
            const id = this.documentClient.put.calls.argsFor(0)[0].Item.id;
            expect(this.broadcastProductEvent).toHaveBeenCalledWith(id);
        });
    
        it('should not save if broadcast fails', async function() {
            this.broadcastProductEvent.and.callFake(() => Promise.reject());
            try {
                await this.createProduct(this.context);
            } catch(e) {}
            expect(this.documentClient.put).not.toHaveBeenCalled();
        });
    });
});