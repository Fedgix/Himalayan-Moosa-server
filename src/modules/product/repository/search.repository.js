import Product from '../models/product.model.js';
import Category from '../../category/models/category.model.js';

const searchRepository = {
  // Optimized product search with all filters
  searchProducts: async (query, filters = {}) => {
    const { page = 1, limit = 20, sortBy = 'relevance' } = filters;
    const skip = (page - 1) * limit;
    
    // Build match conditions
    const matchConditions = searchRepository.buildMatchConditions(query, filters);
    
    // Build sort stage
    const sortStage = searchRepository.buildSortStage(sortBy);
    
    const pipeline = [
      ...(matchConditions.length > 0 ? [{ $match: { $and: matchConditions } }] : []),
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$category', 0] },
          currentPrice: {
            $cond: {
              if: { $gt: ['$pricing.salePrice', 0] },
              then: '$pricing.salePrice',
              else: '$pricing.originalPrice'
            }
          },
          discountPercentage: {
            $cond: {
              if: { $gt: ['$pricing.salePrice', 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ['$pricing.originalPrice', '$pricing.salePrice'] },
                          '$pricing.originalPrice'
                        ]
                      },
                      100
                    ]
                  },
                  2
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          shortDescription: 1,
          pricing: 1,
          currentPrice: 1,
          discountPercentage: 1,
          images: 1,
          category: 1,
          compatibility: 1,
          features: 1,
          specifications: 1,
          inventory: 1,
          isActive: 1,
          isFeatured: 1,
          views: 1,
          salesCount: 1,
          createdAt: 1
        }
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit }
    ];

    return await Product.aggregate(pipeline).exec();
  },

  // Fast category search
  searchCategories: async (query, limit = 5) => {
    if (!query) return [];
    
    const searchRegex = new RegExp(query.split(' ').map(word => `(?=.*${word})`).join(''), 'i');
    
    return await Category.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
    .select('name description image icon')
    .sort({ name: 1 })
    .limit(limit)
    .lean()
    .exec();
  },

  // Count total search results
  countSearchResults: async (query, filters = {}) => {
    const matchConditions = searchRepository.buildMatchConditions(query, filters);
    
    const pipeline = [
      ...(matchConditions.length > 0 ? [{ $match: { $and: matchConditions } }] : []),
      { $count: 'total' }
    ];

    const result = await Product.aggregate(pipeline).exec();
    return result.length > 0 ? result[0].total : 0;
  },

  // Get product suggestions for autocomplete
  getProductSuggestions: async (query, limit = 8) => {
    const searchRegex = new RegExp(`^${query}`, 'i');
    
    const products = await Product.find({ 
      name: searchRegex,
      isActive: true 
    })
      .select('name')
      .sort({ salesCount: -1, name: 1 })
      .limit(limit)
      .lean()
      .exec();

    return products.map(p => p.name);
  },

  // Get category suggestions for autocomplete
  getCategorySuggestions: async (query, limit = 3) => {
    const searchRegex = new RegExp(`^${query}`, 'i');
    
    const categories = await Category.find({
      isActive: true,
      name: searchRegex
    })
    .select('name')
    .sort({ name: 1 })
    .limit(limit)
    .lean()
    .exec();

    return categories.map(c => c.name);
  },

  // Get trending items for empty searches
  getTrendingItems: async (limit = 20) => {
    const products = await Product.find({ isActive: true })
      .select('name description shortDescription pricing images categoryId salesCount views')
      .sort({ salesCount: -1, views: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return products.map(product => ({
      type: 'product',
      id: product._id,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      pricing: product.pricing,
      images: product.images,
      categoryId: product.categoryId,
      salesCount: product.salesCount,
      views: product.views
    }));
  },

  // Get trending search terms
  getTrendingTerms: async (limit = 10) => {
    const [topCategories, popularProducts] = await Promise.all([
      Category.find({ isActive: true })
        .select('name')
        .sort({ name: 1 })
        .limit(5)
        .lean()
        .exec(),
      Product.find({ isActive: true })
        .select('name categoryId')
        .sort({ salesCount: -1 })
        .limit(5)
        .lean()
        .exec()
    ]);

    const trending = [
      ...topCategories.map(c => c.name),
      ...popularProducts.map(p => p.name),
      'spare parts', 'accessories', 'maintenance', 'performance'
    ];

    return [...new Set(trending)].slice(0, limit);
  },

  // Helper: Build match conditions
  buildMatchConditions: (query, filters) => {
    const conditions = [];
    
    // Text search
    if (query) {
      const searchRegex = new RegExp(query.split(' ').map(word => `(?=.*${word})`).join(''), 'i');
      conditions.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { 'features': { $in: [new RegExp(query, 'i')] } }
        ]
      });
    }
    
    // Filter conditions
    if (filters.categoryId) conditions.push({ categoryId: filters.categoryId });
    if (filters.isActive !== undefined) conditions.push({ isActive: filters.isActive });
    if (filters.isFeatured !== undefined) conditions.push({ isFeatured: filters.isFeatured });
    if (filters.inStock !== false) conditions.push({ 'inventory.stock': { $gt: 0 } });
    
    // Price filters
    if (filters.minPrice || filters.maxPrice) {
      const priceConditions = [];
      if (filters.minPrice) {
        priceConditions.push(
          { 'pricing.originalPrice': { $gte: filters.minPrice } },
          { 'pricing.salePrice': { $gte: filters.minPrice } }
        );
      }
      if (filters.maxPrice) {
        priceConditions.push(
          { 'pricing.originalPrice': { $lte: filters.maxPrice } },
          { 'pricing.salePrice': { $lte: filters.maxPrice } }
        );
      }
      if (priceConditions.length > 0) {
        conditions.push({ $or: priceConditions });
      }
    }
    
    return conditions;
  },

  // Helper: Build sort stage
  buildSortStage: (sortBy) => {
    switch (sortBy) {
      case 'price_low':
        return { 'pricing.originalPrice': 1, salesCount: -1 };
      case 'price_high':
        return { 'pricing.originalPrice': -1, salesCount: -1 };
      case 'newest':
        return { createdAt: -1, salesCount: -1 };
      case 'popular':
        return { salesCount: -1, views: -1 };
      case 'featured':
        return { isFeatured: -1, salesCount: -1 };
      default:
        return { salesCount: -1, views: -1 };
    }
  }
};

export default searchRepository;
