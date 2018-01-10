'use strict';


describe('products', function () {
    describe('productValidator', function () {
        describe('validate', function () {

            beforeEach(function () {
                this.validProduct = {
                    name: 'widget',
                    imageURL: 'https://example.com/widget.jpg'
                };

                this.productValidator = require('./productValidator');
            });

            it('should return nothing if the product is valid', function() {
                const result = this.productValidator.validate(this.validProduct);
                expect(result).not.toBeDefined();
            });

            it('should return invalid if name is undefined', function() {
                delete this.validProduct.name;
                const result = this.productValidator.validate(this.validProduct);
                expect(result.name).toContain("Name can't be blank");
            });

            it('should return invalid if name is an empty string', function() {
                this.validProduct.name = '';
                const result = this.productValidator.validate(this.validProduct);
                expect(result.name).toContain("Name can't be blank");
            });

            it('should return invalid if name is a blank string', function() {
                this.validProduct.name = '   ';
                const result = this.productValidator.validate(this.validProduct);
                expect(result.name).toContain("Name can't be blank");
            });

            it('should return valid if name has a space', function() {
                this.validProduct.name = 'test product';
                const result = this.productValidator.validate(this.validProduct);
                expect(result).not.toBeDefined();
            });
        });
    });
});