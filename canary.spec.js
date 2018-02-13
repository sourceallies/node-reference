
describe('Canary test case', function() {
    beforeEach(function() {
        this.saying = 'cheep';
    });

    it('should say cheep', function() {
        expect(this.saying).toEqual('cheep');
    });
});