/**==============================================
 * ?                    ABOUT
 * @author      : Alexandre T. Enokida (atenokida)
 * @createdOn   : 24/june/2025
 * @brief       : Entry point for the server.
 * @description : This file initializes the Express application, 
 *                sets up middleware and routes, connects to the databases, and starts the server.
 *=============================================**/

/*--------------- IMPORTS ---------------------*/
import express from 'express';
import YAML from 'yamljs';
import * as swaggerUi from 'swagger-ui-express';

import * as config from './config/index.js';
import {apiRoutes} from './routes/url.js';

import * as cassandra from './services/cassandraService.js';
import * as redis from './services/redisService.js';
/*--------------- END OF SECTION --------------*/

const app = express();
const swaggerDocument = YAML.load('./swagger-api.yaml');

// `express.json()` is a built-in middleware function 
// in Express for parsing incoming requests with JSON payloads.
app.use(express.json());

// Route for serving the Swagger API documentation.
// Example taken from: https://github.com/scottie1984/swagger-ui-express?tab=readme-ov-file#usage
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Application routes.
app.use('/', apiRoutes);

const startServer = async () => {
  try {
    // Try to connect before exposing the application.
    // Note that the server will fail to start
    // if the connection doesn't succeed.
    await cassandra.connect();
    await redis.connect();

    app.listen(config.server.port, () => {
      console.log(`Servidor disponível por meio da porta ${config.server.port}`);
      console.log(`Localização da documentação: ${config.server.baseUrl}/api-docs`);
    });
  } catch (error) {
    console.error(`ERRO ao iniciar o servidor: ${error}`);
    process.exit(1);
  }
};

startServer();