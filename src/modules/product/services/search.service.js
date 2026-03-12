import searchRepository from '../repository/search.repository.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

const searchService = {
  // Unified search method
  performSearch: async (query, type = 'all', filters = {}) => {
    const startTime = Date.now();
    
    // Handle different search types
    switch (type) {
      case 'suggestions':
        return await searchService.getSearchSuggestions(query, filters.limit);
      case 'trending':
        return await searchService.getTrendingSearches(filters.limit);
      case 'categories':
        return await searchService.searchCategoriesOnly(query, filters.limit);
      case 'products':
        return await searchService.searchProductsOnly(query, filters);
      default:
        return await searchService.performUnifiedSearch(query, filters, startTime);
    }
  },

  // Main unified search logic
  performUnifiedSearch: async (query, filters, startTime) => {
    // Quick validation
    if (query && query.trim().length < 2) {
      throw new CustomError(
        'Search query must be at least 2 characters long',
        HttpStatusCode.BAD_REQUEST,
        true
      );
    }

    const sanitizedQuery = query ? query.trim().toLowerCase() : '';
    
    // For empty query, return trending/popular items
    if (!sanitizedQuery) {
      const trending = await searchRepository.getTrendingItems(filters.limit || 20);
      return {
        query: '',
        type: 'trending',
        totalResults: trending.length,
        results: trending,
        searchTime: Date.now() - startTime
      };
    }

    // Parallel execution for speed
    const promises = [];
    
    // Always search products
    promises.push(searchRepository.searchProducts(sanitizedQuery, filters));
    
    // Add categories for general searches (not when specific filters are applied)
    if (!filters.category && !filters.gender && !filters.season) {
      promises.push(searchRepository.searchCategories(sanitizedQuery, Math.min(filters.limit || 20, 5)));
    } else {
      promises.push(Promise.resolve([])); // Empty categories
    }

    const [productResults, categoryResults] = await Promise.all(promises);

    // Get total count for pagination (only for product searches)
    const totalCount = await searchRepository.countSearchResults(sanitizedQuery, filters);

    // Combine and optimize results
    const combinedResults = searchService.combineAndOptimizeResults(
      productResults.results || productResults,
      categoryResults,
      sanitizedQuery,
      filters.limit || 20
    );

    return {
      query: sanitizedQuery,
      filters: filters,
      totalResults: totalCount,
      currentPage: filters.page || 1,
      totalPages: Math.ceil(totalCount / (filters.limit || 20)),
      results: combinedResults,
      searchTime: Date.now() - startTime
    };
  },

  // Search categories only
  searchCategoriesOnly: async (query, limit = 10) => {
    if (!query || query.trim().length < 2) {
      return { results: [], totalResults: 0 };
    }

    const categories = await searchRepository.searchCategories(query.trim().toLowerCase(), limit);
    return {
      query: query.trim().toLowerCase(),
      type: 'categories',
      totalResults: categories.length,
      results: categories.map(cat => ({
        type: 'category',
        id: cat._id,
        name: cat.name,
        description: cat.description,
        image: cat.image
      }))
    };
  },

  // Search products only
  searchProductsOnly: async (query, filters) => {
    const results = await searchRepository.searchProducts(query ? query.trim().toLowerCase() : '', filters);
    const totalCount = await searchRepository.countSearchResults(query ? query.trim().toLowerCase() : '', filters);

    return {
      query: query ? query.trim().toLowerCase() : '',
      type: 'products',
      filters: filters,
      totalResults: totalCount,
      currentPage: filters.page || 1,
      totalPages: Math.ceil(totalCount / (filters.limit || 20)),
      results: (results.results || results).map(product => ({
        type: 'product',
        id: product._id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        minPrice: product.minPrice,
        maxPrice: product.maxPrice,
        category: product.category,
        gender: product.gender,
        season: product.season,
        defaultImage: product.defaultImage,
        thumbnailImage: product.thumbnailImage,
        salesCount: product.salesCount,
        totalStock: product.totalStock,
        variants: product.variants || []
      }))
    };
  },

  // Get search suggestions for autocomplete
  getSearchSuggestions: async (query, limit = 10) => {
    if (!query || query.trim().length < 2) {
      // Return trending suggestions instead
      const trending = await searchRepository.getTrendingTerms(limit);
      return {
        query: '',
        type: 'suggestions',
        suggestions: trending
      };
    }

    const sanitizedQuery = query.trim().toLowerCase();
    
    const [productSuggestions, categorySuggestions] = await Promise.all([
      searchRepository.getProductSuggestions(sanitizedQuery, Math.ceil(limit * 0.7)),
      searchRepository.getCategorySuggestions(sanitizedQuery, Math.floor(limit * 0.3))
    ]);

    const suggestions = [...categorySuggestions, ...productSuggestions].slice(0, limit);

    return {
      query: sanitizedQuery,
      type: 'suggestions',
      suggestions: suggestions
    };
  },

  // Get trending searches
  getTrendingSearches: async (limit = 10) => {
    const trending = await searchRepository.getTrendingTerms(limit);
    return {
      type: 'trending',
      trending: trending
    };
  },

  // Optimized method to combine and prioritize search results
  combineAndOptimizeResults: (productResults, categoryResults, query, limit) => {
    const combined = [];
    
    // Add categories first (higher priority for navigation)
    if (categoryResults && categoryResults.length > 0) {
      categoryResults.forEach(category => {
        combined.push({
          type: 'category',
          id: category._id,
          name: category.name,
          description: category.description,
          image: category.image,
          relevanceScore: searchService.calculateRelevanceScore(category.name, query)
        });
      });
    }

    // Add products
    if (productResults && productResults.length > 0) {
      productResults.forEach(product => {
        combined.push({
          type: 'product',
          id: product._id,
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          minPrice: product.minPrice,
          maxPrice: product.maxPrice,
          category: product.category,
          gender: product.gender,
          season: product.season,
          defaultImage: product.defaultImage,
          thumbnailImage: product.thumbnailImage,
          salesCount: product.salesCount,
          totalStock: product.totalStock,
          variants: product.variants || [],
          relevanceScore: searchService.calculateRelevanceScore(product.name, query)
        });
      });
    }

    // Sort by relevance score and limit results
    return combined
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  },

  // Optimized relevance score calculation
  calculateRelevanceScore: (text, query) => {
    if (!text || !query) return 0;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 0;
    
    // Exact match gets highest score
    if (textLower === queryLower) return 100;
    
    // Starts with query gets high score
    if (textLower.startsWith(queryLower)) score += 80;
    
    // Contains query gets medium score
    else if (textLower.includes(queryLower)) score += 60;
    
    // Word boundary matches
    const words = queryLower.split(' ');
    words.forEach(word => {
      if (word.length > 2) {
        const wordRegex = new RegExp(`\\b${word}`, 'i');
        if (wordRegex.test(textLower)) score += 30;
      }
    });
    
    // Length penalty for very long texts (prefer concise matches)
    if (textLower.length > queryLower.length * 3) {
      score *= 0.9;
    }
    
    return score;
  }
};

export default searchService;