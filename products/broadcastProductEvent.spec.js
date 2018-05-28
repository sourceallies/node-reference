
const proxyquire = require('proxyquire');

describe('broadcastProductEvent', function() {
    beforeEach(function() {
        process.env.PRODUCT_EVENTS_TOPIC_ARN = 'aws::arn::products-topic';

        const mockSNSClient = this.mockSNSClient = {
            publish() {
                return {
                    promise: () => Promise.resolve()
                };
            }
        };
        spyOn(mockSNSClient, 'publish').and.callThrough();

        const SNS = function() {
            return mockSNSClient;
        };
        this.broadcastProductEvent = proxyquire('./broadcastProductEvent', {
            'aws-sdk': {SNS}
        });
    });

    it('should send the message to the correct topic', async function() {
        await this.broadcastProductEvent('abc');
        expect(this.mockSNSClient.publish.calls.argsFor(0)[0].TopicArn).toEqual('aws::arn::products-topic');
    });

    it('should send the id as a JSON encoded object', async function () {
        await this.broadcastProductEvent('abc');
        const message = this.mockSNSClient.publish.calls.argsFor(0)[0].Message;
        const body = JSON.parse(message);
        expect(body).toEqual({id: 'abc'});
    });

    it('should not call publish if PRODUCT_EVENTS_TOPIC_ARN is undefined', async function() {
        delete process.env.PRODUCT_EVENTS_TOPIC_ARN;
        await this.broadcastProductEvent('abc');
        expect(this.mockSNSClient.publish).not.toHaveBeenCalled();        
    });

    it('should not call publish if PRODUCT_EVENTS_TOPIC_ARN is empty', async function() {
        process.env.PRODUCT_EVENTS_TOPIC_ARN = '';
        await this.broadcastProductEvent('abc');
        expect(this.mockSNSClient.publish).not.toHaveBeenCalled();        
    });
});