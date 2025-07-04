/**==============================================
 * ?                    ABOUT
 * @author      : Alexandre T. Enokida (atenokida)
 * @createdOn   : 24/june/2025
 * @brief       : Service for managing operations within Redis.
 *=============================================**/

import {createClient} from 'redis';
import * as config from '../config/index.js';

// Application client connection of Redis
// Example taken from: https://redis.io/docs/latest/develop/clients/nodejs
const client = createClient({ url: config.redis.url });

client.on('error', (err) => console.error('Erro no Cliente Redis:', err));

export async function connect() {
  try {
    await client.connect();
    console.log('Conectado ao servidor Redis.');
  } catch (err) {
    console.error(`ERRO ao conectar com Redis: ${err}`);
    process.exit(1);
  }
}

/**
 * @param shortCode The unique compact identifier for the URL.
 */
export async function getUrl(shortCode) {
  return client.get(shortCode);
}

/**
 * @param shortCode The unique compact identifier for the URL.
 * @param longUrl The original URL.
 */
export async function setUrl(shortCode, longUrl) {
  // EX seconds -- Set the specified expire time, in seconds (a positive integer).
  // See more at: https://redis.io/docs/latest/commands/set
  // 86400 seconds = 24 hours
  return client.set(shortCode, longUrl, { EX: 86400 });
}