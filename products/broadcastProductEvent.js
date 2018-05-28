
const AWS = require('aws-sdk');
const snsClient = new AWS.SNS();

module.exports = async function broadcastProductEvent(id) {
    const TopicArn = process.env.PRODUCT_EVENTS_TOPIC_ARN;
    if(TopicArn) {
        await snsClient.publish({
            TopicArn,
            Message: JSON.stringify({id})
        });
    }
};