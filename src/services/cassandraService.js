/**==============================================
 * ?                    ABOUT
 * @author      : Alexandre T. Enokida (atenokida)
 * @createdOn   : 24/june/2025
 * @brief       : Service for managing Cassandra database operations.
 * @description : This module provides functions to connect to the Cassandra database,
 *                add URLs, and retrieve URLs.
 *=============================================**/

import * as cassandra from 'cassandra-driver';
import * as config from '../config/index.js';

// Application client connection of Cassandra
const client = new cassandra.Client({
  contactPoints: config.cassandra.contactPoints,
  localDataCenter: config.cassandra.localDataCenter,
  keyspace: config.cassandra.keyspace
});

export async function connect() {
  try {
    await client.connect();
    console.log('Conectado ao cluster do Cassandra.');
  } catch (err) {
    console.error(`ERRO ao conectar com Cassandra: ${err}`);
    process.exit(1);
  }
}

/**
 * @param shortCode The unique compact identifier for the URL.
 * @param longUrl The original URL.
 * @param alias An optional alias for the URL.
 */
export async function addUrl(shortCode, longUrl, alias = null) {
  try {
    const query = 'INSERT INTO urls (short_code, alias, long_url, created_at, access_count) VALUES (?, ?, ?, toTimestamp(now()), 0)';
    const params = [shortCode, alias || '', longUrl];
    
    // **Prepare is a statement to tell Cassandra to parse the query string, cache the result and return a unique identifier for it.
    // It is ideal for queries that run multiple times with different parameters.
    // See more at:
      // - https://github.com/datastax/nodejs-driver?tab=readme-ov-file#prepare-your-queries
      // - https://docs.datastax.com/en/datastax-drivers/developing/prepared-statements.html
      // - (Java version) https://docs.datastax.com/en/developer/java-driver/3.0/manual/statements/prepared/index.html
    // **Consistency defines the Write Consistency Policy.
    // Since this is a learning project, we arbitrarily define the CONSISTENCY LEVEL to be 'QUORUM'.
    // For short, a QUORUM is the number of nodes to be written.
    // Note that these are two distinct definitions:
    //   - QUORUM: The number of nodes to be written.
    //   - QUORUM (CONSISTENCY LEVEL): A Write Consistency Policy.
    // See more at:
      // - https://docs.datastax.com/en/cassandra-oss/3.0/cassandra/dml/dmlConfigConsistency.html
    return client.execute(query, params, { prepare: true, consistency: cassandra.types.consistencies.quorum });
  
  } catch (err) {
    console.error(`ERRO ao salvar URL: ${err}`);
    throw err;
  }
}

/**
 * @param shortCode The unique compact identifier for the URL to be retrieved.
 */
export async function getUrlByShortCode(shortCode) {
  try {
    const query = 'SELECT short_code, alias, long_url, created_at, access_count FROM urls WHERE short_code = ?';
    const result = await client.execute(query, [shortCode], { prepare: true, consistency: cassandra.types.consistencies.quorum });
    
    return result.rows[0];
  } catch (err) {
    console.error(`ERRO ao recuperar URL: ${err}`);
    throw err;
  }
}

/**
 * @param shortCode The unique compact identifier for the URL.
 * @param count The value to increment the access count by.
 */
export async function incrementAccessCount(shortCode, count) {
  try {
    const query = 'UPDATE urls SET access_count = ? WHERE short_code = ?';
    await client.execute(query, [count, shortCode], { prepare: true, consistency: cassandra.types.consistencies.quorum });

  } catch (err) {
    console.error(`ERRO ao incrementar contagem de acessos: ${err}`);
    throw err;
  }
}

/**
 * Increments the access count for the given short code.
 * Note that increment operations are not supported for non counter
 * column types in CassandraDB. In this case, the naive solution is to
 * read the current value, increment it, and write it back.
 * @param shortCode The unique compact identifier for the URL.
 */
export async function getAccessCountAndIncrement(shortCode) {
  try {
    let query = 'SELECT access_count FROM urls WHERE short_code = ?';
    const result = await client.execute(query, [shortCode], { prepare: true, consistency: cassandra.types.consistencies.quorum });

    // `toNumber()` is necessary for Big Int values in Cassandra.
    const newAccessCount = result.rows[0].access_count.toNumber() + 1;

    query = 'UPDATE urls SET access_count = ? WHERE short_code = ?';
    await client.execute(query, 
      [newAccessCount, shortCode], 
      { prepare: true, consistency: cassandra.types.consistencies.quorum }
    );
    
  } catch (err) {
    console.error(`ERRO ao obter contagem de acessos: ${err}`);
    throw err;
  }
}