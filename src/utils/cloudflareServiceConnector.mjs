import https from 'https';
import {logger} from './logger.mjs';

export const API_ENDPOINTS = {
    GET_RECORD: '/client/v4/zones/:{ZONE_IDENTIFIER}/dns_records?name=:{RECORD_NAME}',
    UPDATE_RECORD: '/client/v4/zones/:{ZONE_IDENTIFIER}/dns_records/:{RECORD_IDENTIFIER}'
}

export function cloudflareServiceConnector({
    url,
    method = 'GET',
    data,
}) {
    return new Promise((resolve, reject) => {
        const API_BASE_URL = 'api.cloudflare.com'

        const {
            CLOUDFLARE_AUTH_EMAIL,                // The email used to login 'https://dash.cloudflare.com'
            CLOUDFLARE_AUTH_KEY,                  // Set to "global" for Global API Key or "token" for Scoped API Token
            CLOUDFLARE_AUTH_METHOD,               // Your API Token or Global API Key
        } = process.env
        const headerAuthMethod = CLOUDFLARE_AUTH_METHOD === 'global' ? 'X-Auth-Key' : 'Authorization'
        const headerAuthToken = CLOUDFLARE_AUTH_METHOD === 'global' ? CLOUDFLARE_AUTH_KEY : `Bearer ${CLOUDFLARE_AUTH_KEY}`
        const options = {
            hostname: API_BASE_URL,
            path: url,
            method: method,
            port: 443,
            timeout: 40000,
            headers: {
                'X-Auth-Email': CLOUDFLARE_AUTH_EMAIL,
                [headerAuthMethod]: headerAuthToken,
                'Content-Type': 'application/json'
            },
            body: data
        };
        const request = https.request(options, (resp) => {
            let data = '';

            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                const parsedData = JSON.parse(data);
                const { success } = parsedData;
                if (success) {
                    resolve(parsedData.result);
                } else {
                    reject(parsedData.errors[0])
                }
            });

        })
            .on("error", (err) => {
                logger(err.message, 'error');
                console.error(err)
                reject(err)
            });
        if (data) {
            request.write(JSON.stringify(data))
        }
        request.end();
    })
}
