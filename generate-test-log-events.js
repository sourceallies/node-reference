
process.env.AWS_REGION = 'us-east-1';
const AWS = require('aws-sdk');
const logGroupName = 'prowe-log-stream-test-LogGroup-1S3QR39RX8VKG';
const logStreamNamePrefix = 'stream1';
const logs = new AWS.CloudWatchLogs();


async function go() {
    const streams = await logs.describeLogStreams({
        logGroupName,
        logStreamNamePrefix
    }).promise();

    console.log('got streams', streams);
    const {uploadSequenceToken, logStreamName} = streams.logStreams[0];

    await logs.putLogEvents({
        logGroupName,
        logStreamName,
        sequenceToken: uploadSequenceToken,
        logEvents: [
            {
                timestamp: Date.now(),
                message: JSON.stringify({operation: 'GetItem', latencyMS: 10})
            }
        ]
    }).promise();
}


go().then(
    res => console.log(res),
    err => console.error(err)
);