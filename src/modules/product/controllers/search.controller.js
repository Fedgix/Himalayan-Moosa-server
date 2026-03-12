import catchAsync from '../../../frameworks/middlewares/catch.async.js';
import { sendSuccess } from '../../../utils/response.handler.js';
import searchService from '../services/search.service.js';

const searchController = {
  search: catchAsync(async (req, res) => {
    const { 
      q, 
      type = 'all', // 'all', 'products', 'categories', 'suggestions', 'trending'
      category, 
      gender, 
      season, 
      minPrice, 
      maxPrice, 
      inStock = true,
      sortBy = 'relevance',
      page = 1, 
      limit = 20 
    } = req.query;
    
    const filters = {
      category,
      gender,
      season,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true',
      sortBy,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const results = await searchService.performSearch(q, type, filters);
    
    sendSuccess(res, 'Search completed successfully', results, 200);
  })
};

export default searchController;