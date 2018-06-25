const AWS = require('aws-sdk');
const fetch = require('node-fetch');

async function getDecryptedClientSecret() {
    const kms = new AWS.KMS();
    const result = await kms.decrypt({
        CiphertextBlob: Buffer.from(process.env.ENCRYPTED_CLIENT_SECRET, 'base64')
    }).promise();
    console.log('Get Secret response: ', result);
    return result.Plaintext.toString().trim();
}

async function buildTokenAuthHeader() {
    const client_id = process.env.CLIENT_ID.trim();
    const client_secret = await getDecryptedClientSecret();
    const encodedClientCredentials = new Buffer(`${client_id}:${client_secret}`).toString('base64');
    return `Basic ${encodedClientCredentials}`;
}

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
    console.log('Get Token response: ', responseBody);
    return `Bearer ${responseBody.access_token}`;
};