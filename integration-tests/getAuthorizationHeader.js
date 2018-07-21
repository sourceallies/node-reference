const AWS = require('aws-sdk');
const fetch = require('node-fetch');

// This function uses the AWS KMS api to decrypt the ENCRYPTED_CLIENT_SECRET environment variable
async function getDecryptedClientSecret() {
    const kms = new AWS.KMS();
    const result = await kms.decrypt({
        CiphertextBlob: Buffer.from(process.env.ENCRYPTED_CLIENT_SECRET, 'base64')
    }).promise();
    return result.Plaintext.toString().trim();
}

// This function builds a 'Basic' auth header with the client_id/client_secret 
// so that we can request a token from cognito
async function buildTokenAuthHeader() {
    const client_id = process.env.CLIENT_ID.trim();
    const client_secret = await getDecryptedClientSecret();
    const encodedClientCredentials = new Buffer(`${client_id}:${client_secret}`).toString('base64');
    return `Basic ${encodedClientCredentials}`;
}

// Request a token from cognito and return a built header that can be used in integration tests.
module.exports = async function getAuthHeader() {
    const response = await fetch(process.env.TOKEN_ENDPOINT, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            'Authorization': await buildTokenAuthHeader(),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    const responseBody = await response.json();
    return `Bearer ${responseBody.access_token}`;
};