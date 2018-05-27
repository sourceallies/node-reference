
describe('getElapsedDurationInMs', function() {

    beforeEach(function (){
        this.originalHrtime = process.hrtime;
        spyOn(process, 'hrtime').and.callThrough();
        this.getElapsedDurationInMs = require('./getElapsedDurationInMs');
    });

    it('should pass the starttime to hrtime', function () {
        const start = this.originalHrtime();
        this.getElapsedDurationInMs(start);
        expect(process.hrtime).toHaveBeenCalledWith(start);
    });

    it('should return the computed combination of seconds and nanoseconds', function() {
        process.hrtime.and.returnValue([1, 2e6]);
        const result = this.getElapsedDurationInMs([]);
        expect(result).toBeCloseTo(1002);
    });

    afterEach(function () {
        if(this.originalHrtime) {
            process.hrtime = this.originalHrtime;
        }
    });
});