'use strict';

const proxyquire = require('proxyquire');

describe('products', function () {
    describe('postProduct', function () {

        beforeEach(function () {
            this.product = {
                name: 'widget',
                imageURL: 'https://example.com/widget.jpg'
            };

            this.req = {
                body: this.product
            };
            this.res = {
                json: (obj) => {}
            };
            spyOn(this.res, 'json').and.callThrough();

            this.awsResult = {
                promise: () => Promise.resolve()
            };
            this.documentClient = {
                put: (params) => this.awsResult 
            };
            spyOn(this.documentClient, 'put').and.callThrough();

            this.postProduct = proxyquire('./postProduct', {
                "./documentClient": this.documentClient
            });
        });

        it('should pass the correct TableName to documentClient.put', function(done) {
            this.postProduct(this.req, this.res)
                .then(() => {
                    expect(this.documentClient.put.calls.argsFor(0)[0].TableName).toEqual('Products');
                })
                .then(done, done.fail);
        });

        it('should pass the postedProduct to documentClient.put', function(done) {
            this.postProduct(this.req, this.res)
                .then(() => {
                    expect(this.documentClient.put.calls.argsFor(0)[0].Item).toBe(this.product);
                })
                .then(done, done.fail);
        });

        it('should write the product to res.json', function(done) {
            this.postProduct(this.req, this.res)
                .then(() => {
                    expect(this.res.json).toHaveBeenCalledWith(this.product);
                })
                .then(done, done.fail);
        });

        it('should populate an id on the product', function(done) {
            this.postProduct(this.req, this.res)
                .then(() => {
                    expect(this.documentClient.put.calls.argsFor(0)[0].Item.id).toBeDefined();
                })
                .then(done, done.fail);
        });
    });
});