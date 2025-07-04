/**==============================================
 * ?                    ABOUT
 * @author      : Alexandre T. Enokida (atenokida)
 * @createdOn   : 24/june/2025
 * @brief       : Configuration file for the application.
 *=============================================**/

// Acknowledgements to 2u4u: https://stackoverflow.com/a/65954056
import * as dotenv from 'dotenv';
dotenv.config();

// Environment variables for the application
export const server = { 
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
};

// Environment variables for Redis
export const redis = { url: process.env.REDIS_URL };

// Environment variables for Cassandra
export const cassandra = {
  contactPoints: process.env.CASSANDRA_CONTACT_POINTS.split(','),
  localDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER,
  keyspace: process.env.CASSANDRA_KEYSPACE
};

// Size of the short URL code
export const URL_SIZE = 9;