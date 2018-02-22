describe('validateProduct', function () {
    beforeEach(function () {
        this.validProduct = {
            name: 'widget',
            imageURL: 'https://example.com/widget.jpg'
        };
        this.validateProduct = require('./validateProduct');
    });
  
    it('should return nothing if the product is valid', function() {
        const result = this.validateProduct(this.validProduct);
        expect(result).not.toBeDefined();
    });
  
    describe('name', function() {
      it('should return invalid if name is undefined', function() {
          delete this.validProduct.name;
          const result = this.validateProduct(this.validProduct);
          expect(result.name).toContain("Name can't be blank");
      });
  
      it('should return invalid if name is an empty string', function() {
          this.validProduct.name = '';
          const result = this.validateProduct(this.validProduct);
          expect(result.name).toContain("Name can't be blank");
      });
  
      it('should return invalid if name is a blank string', function() {
          this.validProduct.name = '   ';
          const result = this.validateProduct(this.validProduct);
          expect(result.name).toContain("Name can't be blank");
      });
  
      it('should return valid if name has a space', function() {
          this.validProduct.name = 'test product';
          const result = this.validateProduct(this.validProduct);
          expect(result).not.toBeDefined();
      });
    });

    describe('imageURL', function() {
        it('should return invalid if undefined', function() {
            delete this.validProduct.imageURL;
            const result = this.validateProduct(this.validProduct);
            expect(result.imageURL).toContain("Image url can't be blank");
        });
    
        it('should return invalid if an empty string', function() {
            this.validProduct.imageURL = '';
            const result = this.validateProduct(this.validProduct);
            expect(result.imageURL).toContain("Image url is not a valid url");
        });
    });
});