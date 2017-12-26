'use strict';

const proxyquire = require('proxyquire');

describe('products', function () {
    describe('postProduct', function () {

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
            
            this.productValidator = {
                validate: (product) => undefined
            };
            spyOn(this.productValidator, 'validate').and.callThrough();

            this.awsResult = {
                promise: () => Promise.resolve()
            };
            this.documentClient = {
                put: (params) => this.awsResult
            };
            spyOn(this.documentClient, 'put').and.callThrough();

            this.postProduct = proxyquire('./postProduct', {
                "./documentClient": this.documentClient,
                './productValidator': this.productValidator,
            });
        });

        it('should pass the correct TableName to documentClient.put', async function () {
            await this.postProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].TableName).toEqual('Products');
        });

        it('should pass the postedProduct to documentClient.put', async function () {
            await this.postProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item).toBe(this.product);
        });

        it('should set the product as the body', async function () {
            await this.postProduct(this.context);
            expect(this.context.body).toBe(this.product);
        });

        it('should populate an id on the product', async function () {
            await this.postProduct(this.context);
            expect(this.documentClient.put.calls.argsFor(0)[0].Item.id).toBeDefined();
        });

        it('should return validation errors as the body if validation fails', async function(){
            let errors = {"name": []};
            this.productValidator.validate.and.returnValue(errors);
            await this.postProduct(this.context);
            expect(this.context.body).toBe(errors);
        });

        it('should set status to 400 if validation fails', async function(){
            let errors = {"name": []};
            this.productValidator.validate.and.returnValue(errors);
            await this.postProduct(this.context);
            expect(this.context.status).toEqual(400);
        });

        it('should not save the product if validation fails', async function(){
            let errors = {"name": []};
            this.productValidator.validate.and.returnValue(errors);
            await this.postProduct(this.context);
            expect(this.documentClient.put).not.toHaveBeenCalled();
        });
    });
});