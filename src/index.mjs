import https from 'https';
import {logger} from './utils/logger.mjs';
import {API_ENDPOINTS, cloudflareServiceConnector} from './utils/cloudflareServiceConnector.mjs';
import {ipServiceConnector} from './utils/ipServiceConnector.mjs';


const {
    CLOUDFLARE_AUTH_EMAIL,               // The email used to login 'https://dash.cloudflare.com'
    CLOUDFLARE_AUTH_KEY,                 // Set to "global" for Global API Key or "token" for Scoped API Token
    CLOUDFLARE_AUTH_METHOD,              // Your API Token or Global API Key
    CLOUDFLARE_ZONE_ID,                  // Can be found in the "Overview" tab of your domain
    CLOUDFLARE_RECORD_NAME,              // Which record you want to be synced
    CLOUDFLARE_RECORD_PROXY,             // Set the proxy to true or false
} = process.env

const requiredVars = [
    'CLOUDFLARE_AUTH_EMAIL',
    'CLOUDFLARE_AUTH_KEY',
    'CLOUDFLARE_AUTH_METHOD',
    'CLOUDFLARE_ZONE_ID',
    'CLOUDFLARE_RECORD_NAME',
    'CLOUDFLARE_RECORD_PROXY'
]

const missingVars = requiredVars.filter(variable => !process.env[variable] )
if (missingVars.length >= 1) {
    logger("One or more required variables are unset, check config and try again.", 'error')
    logger(`Missing variables are ${missingVars.join(', ')}`, 'error')
    process.exit(1)
}

async function init({ip, record, proxy}){
    logger(`Requesting record id for record ${record}`)
    const recordIdUrl = API_ENDPOINTS.GET_RECORD
        .replace(':{ZONE_IDENTIFIER}', CLOUDFLARE_ZONE_ID)
        .replace(':{RECORD_NAME}', record)

    const recordIdResponse = await cloudflareServiceConnector({ url: recordIdUrl })
    const recordId = recordIdResponse[0].id

    const updateRecordUrl = API_ENDPOINTS.UPDATE_RECORD
        .replace(':{ZONE_IDENTIFIER}', CLOUDFLARE_ZONE_ID)
        .replace(':{RECORD_IDENTIFIER}', recordId)
    const updateRecordBody = {
        type:"A",
        name: record,
        content: ip,
        ttl: 1,
        proxied: proxy
    }
    logger(`Requesting record update for id ${recordId} for record ${record}`)
    return await cloudflareServiceConnector({ url: updateRecordUrl, data: updateRecordBody, method: 'PUT' })

}
const RECORD_PROMISES = []

const recordArray = CLOUDFLARE_RECORD_NAME.split(',');
/*
* REQUESTING PUBLIC IP
*/
await ipServiceConnector()
    .then(ip => {
        recordArray.forEach(recordData => {
            const [record, proxy = CLOUDFLARE_RECORD_PROXY] = recordData.split(':');
            // Proxy value is passed as string or if the proxy value is string when defined or taken from the global env.
            // When the value is string returning proxy === 'true' converts to true boolean otherwise is false,
            // that means incorrect or 'false' is treated as boolean false
            logger(`Proxy original value for record ${record} is ${proxy}(${typeof proxy}) parsed value is ${typeof proxy === 'string' ? proxy === 'true' : proxy}`);
            const promise = init({ip, record, proxy: typeof proxy === 'string' ? proxy === 'true' : proxy})
                .then(response => {
                    const { content } = response
                    logger(`Record ${record} updated correctly with IP ${content}.`)
                })
                .catch((error) => {
                    logger(`Error updating record ${record}.`, 'error')
                    console.error(error);
                });
            RECORD_PROMISES.push(promise)
        })
        Promise.allSettled(RECORD_PROMISES)
            .then((results) => {
                const allSucceeded = results.every(result => result.status === 'fulfilled')
                if (allSucceeded) {
                    logger('All records updated successfully.')
                    process.exit(0)
                } else {
                    logger('Some records failed to update.')
                    process.exit(1)
                }
            })
    })
    .catch(error => {
        logger('Couldn\'t find source IP address.')
        console.error(error);
    })

