
const proxyquire = require('proxyquire');

describe('hello handler', function() {
    beforeEach(function() {
        this.context = {};
        this.hello = proxyquire('./hello', {});
    });

    it('should respond with a 200 status', async function() {
        await this.hello(this.context);
        expect(this.context.status).toEqual(200);
    });

    it('should responsd with a hello message', async function() {
        await this.hello(this.context);
        expect(this.context.body).toEqual({message: 'hello'});
    });
});