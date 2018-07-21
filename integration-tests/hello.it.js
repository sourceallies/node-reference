const fetch = require('node-fetch');

describe('hello', function() {
    beforeAll(async function() {
        this.baseURL = process.env.BASE_URL || 'http://localhost:3000/';
        this.response = await fetch(`${this.baseURL}hello`);
        this.responseBody = this.response.ok && await this.response.json();
        console.log('Response ', this.responseBody);
    });

    it('should return an ok status code', function() {
        expect(this.response.status).toEqual(200);
    });

    it('should return an object', function () {
        expect(this.responseBody).toEqual(jasmine.any(Object));
    });

    it('should return the correct message', function (){
        expect(this.responseBody.message).toEqual('hello');
    });
});