import https from 'https';
import {logger} from './logger.mjs';

export function ipServiceConnector() {
    return new Promise((resolve, reject) => {
        const request = https.get('https://api.ipify.org ', (resp) => {
            let data = '';

            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', async () => {
                logger(`Your public IP is ${data}`, 'info');
                resolve(data)
            });

        })
            .on("error", (err) => {
                logger(err.message, 'error');
                reject(err)
            });
        request.end();
    })
}
