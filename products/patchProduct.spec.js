'use strict';

const proxyquire = require('proxyquire');

describe('Patch Product', () => {
    beforeEach(function () {
        process.env.PRODUCTS_TABLE_NAME = 'products_table';

        this.existingProduct = {
            name: 'widget',
            imageURL: 'https://example.com/widget.jpg'
        };

        this.context = {
            request: {
                body: []
            },
            params: {
                id: 'abc'
            }
        };
        
        this.validateProduct = (product) => undefined;
        spyOn(this, 'validateProduct').and.callThrough();

        this.awsResult = {
            promise: () => Promise.resolve({Item: this.existingProduct})
        };
        this.documentClient = {
            get: (params) => this.awsResult,
            put: (params) => ({promise: () => Promise.resolve()})
        };
        spyOn(this.documentClient, 'get').and.callThrough();
        spyOn(this.documentClient, 'put').and.callThrough();

        this.patchProduct = proxyquire('./patchProduct', {
            "./documentClient": this.documentClient,
            './validateProduct': this.validateProduct,
        });
    });

    it('should pass the correct parameter structure to documentClient.get', async function(){
        this.context.params.id = 'abc';
        await this.patchProduct(this.context);
        
        const expectedParams = {
            TableName: 'products_table',
            Key: {
                id: 'abc'
            }
        };
        expect(this.documentClient.get.calls.argsFor(0)[0]).toEqual(expectedParams);
    });

    it('should return validation errors as the body if validation fails', async function(){
        let errors = {"name": []};
        this.validateProduct.and.returnValue(errors);
        await this.patchProduct(this.context);
        expect(this.context.body).toBe(errors);
    });

    it('should set status to 400 if validation fails', async function(){
        let errors = {"name": []};
        this.validateProduct.and.returnValue(errors);
        await this.patchProduct(this.context);
        expect(this.context.status).toEqual(400);
    });

    it('should not save the product if validation fails', async function(){
        this.validateProduct.and.returnValue({"name": []});
        await this.patchProduct(this.context);
        expect(this.documentClient.put).not.toHaveBeenCalled();
    });

    it('should pass the patched product to documentClient.put', async function() {
        this.existingProduct.name = 'widget_before';
        this.existingProduct.imageURL = 'http://example.com';
        this.context.request.body = [
            {op: 'replace', path: '/name', value: 'widget_after'}
        ];
        await this.patchProduct(this.context);

        const expectedProduct = {
            name: 'widget_after',
            imageURL: 'http://example.com'
        };
        expect(this.documentClient.put.calls.argsFor(0)[0].Item).toEqual(expectedProduct);
    });

    it('should return the patched product', async function() {
        this.existingProduct.name = 'widget_before';
        this.existingProduct.imageURL = 'http://example.com';
        this.context.request.body = [
            {op: 'replace', path: '/name', value: 'widget_after'}
        ];
        await this.patchProduct(this.context);

        const expectedProduct = {
            name: 'widget_after',
            imageURL: 'http://example.com'
        };
        expect(this.context.body).toEqual(expectedProduct);
    });
});