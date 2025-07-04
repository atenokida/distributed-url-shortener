/**==============================================
 * ?                    ABOUT
 * @author      : Alexandre T. Enokida (atenokida)
 * @createdOn   : 24/june/2025
 * @brief       : Controller for managing URL shortening operations.
 * @description : This module provides functions to create short URLs and resolve them to their original URLs.
 *                It handles URL validation and checks for existing short codes.
 *=============================================**/

/*--------------- IMPORTS ---------------------*/
import {nanoid} from 'nanoid';

import {server, URL_SIZE} from '../config/index.js';

import * as cassandraService from '../services/cassandraService.js';
import * as redisService from '../services/redisService.js';
/*--------------- END OF SECTION --------------*/

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    console.log(`URL inválida: ${err}`);
    return false;
  }
}

// Increments the access count for the given short code with the provided value.
function incrementAccessCount(shortCode, value) {
  try {
    cassandraService.incrementAccessCount(shortCode, value);
  } catch (err) {
    throw new Error(`ERRO ao incrementar o número de acessos para ${shortCode}: ${err}`);
  }
}

// Creates a shortened URL for the provided long URL.
// Performs all necessary validation and checks for 
// short codes collisions (unlikely).
export async function createShortUrl(req, res) {
  try {
    const { url, alias } = req.body;

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ message: 'Requisição inválida. A URL fornecida é inválida.' });
    }

    // Generate a unique short code using nanoid.
    const shortCode = nanoid(URL_SIZE);

    // Validate collisions.
    const existingUrl = await cassandraService.getUrlByShortCode(shortCode);
    if (existingUrl) {
      return res.status(200).json({
        short_url: `${server.baseUrl}/${shortCode}`,
        short_code: shortCode,
        alias: existingUrl.alias,
        long_url: existingUrl.long_url,
        created_at: existingUrl.created_at,
      });
    }

    await cassandraService.addUrl(shortCode, url, alias);

    // Build response object.
    const response = {
      short_url: `${server.baseUrl}/${shortCode}`,
      short_code: shortCode,
      alias: alias || null,
      long_url: url,
      created_at: new Date().toISOString(), // This date isn't stored in the database, but generated here.
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error(`ERRO ao criar URL encurtada: ${error}`);
    return res.status(500).json({ message: 'ERRO interno do servidor.' });
  }
};

// Resolves a short URL to its original URL.
// It first checks the cache (Redis) for the long URL.
// If not found, it queries the Cassandra database.
// If the URL is found and valid, it redirects the user to that URL.
export async function resolveUrl(req, res) {
  try {
    // See short_url in the URL path (/:short_url).
    const { short_url: shortCode } = req.params;
    
    // Do a cache lookup.
    let longUrl = await redisService.getUrl(shortCode);

    // If cache hit, immediately redirect to the long URL.
    if (longUrl) {
      console.log(`Cache HIT para: ${shortCode}\n`);
      console.log(`Long URL: ${longUrl}`);
      
      res.redirect(301, longUrl);

      // Search for the current count access value and 
      // increment the access count for the short code.
      // Note that the access count is not stored in Redis,
      // it is only stored in Cassandra.
      cassandraService.getAccessCountAndIncrement(shortCode);

      return;
    }
    
    console.log(`Cache MISS para: ${shortCode}`);
    
    // If the URL is not found in the cache, run a query in DB.
    const result = await cassandraService.getUrlByShortCode(shortCode);
    
    if (result && isValidUrl(result.long_url)) {
      longUrl = result.long_url;

      res.redirect(301, longUrl);

      // Save the result in cache for future requests.
      redisService.setUrl(result.short_code, longUrl);

      // Increment the access count for the short code.
      incrementAccessCount(result.short_code, result.access_count + 1);
      
      return;

    } else {
      return res.status(404).json({ message: 'Recurso não encontrado.' });
    }

  } catch (error) {
    console.error(`ERRO ao resolver URL: ${error}`);
    return res.status(500).json({ message: 'ERRO interno do servidor.' });
  }
};