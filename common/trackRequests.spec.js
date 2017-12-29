'use strict';

const proxyquire = require('proxyquire');

describe('common', function () {

    describe('trackRequests', function () {

        beforeEach(function () {
            this.context = {};
            this.next = (ctx) => Promise.resolve();
            spyOn(this, 'next').and.callThrough();

            this.trackRequests = require('./trackRequests');
        });

        it('should return a function', function(){
            let middleware = this.trackRequests('test');
            expect(typeof middleware).toEqual('function');
        });

        it('the middleware should pass ctx to next', async function() {
            let middleware = this.trackRequests('test');
            await middleware(this.context);
            expect(this.next).toHaveBeenCalledWith(this.context);
        });
    });
});