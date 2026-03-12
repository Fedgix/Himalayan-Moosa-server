import { Router } from 'express';
import searchController from '../../modules/product/controllers/search.controller.js';
import cacheMiddleware from '../middlewares/cache.middleware.js';

const searchRouter = Router();

// Single unified search endpoint
searchRouter.get('/', 
  cacheMiddleware(3 * 60 * 1000), // 3 minutes cache
  searchController.search
);

export default searchRouter;