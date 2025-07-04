/**==============================================
 * ?                    ABOUT
 * @author      : Alexandre T. Enokida (atenokida)
 * @createdOn   : 24/june/2025
 * @brief       : Router for URL shortening operations.
 *=============================================**/

import express from 'express';

import * as urlController from '../controllers/urlController.js';

const router = express.Router();

router.post('/url', urlController.createShortUrl);

router.get('/:short_url', urlController.resolveUrl);

export const apiRoutes = router;