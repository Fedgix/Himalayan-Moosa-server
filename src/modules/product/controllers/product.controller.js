import ProductService from '../services/product.service.js';
import catchAsync from '../../../frameworks/middlewares/catch.async.js';
import { sendSuccess } from '../../../utils/response.handler.js';

class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

      createProduct = catchAsync(async (req, res) => {
        const result = await this.productService.createProduct(req.body);
        return sendSuccess(res, result.message, result.data, 201);
    });

    generateSlugAndSku = catchAsync(async (req, res) => {
        const { name, partType, fitmentType } = req.body;
        const result = await this.productService.generateSlugAndSku(name, partType, fitmentType);
        return sendSuccess(res, result.message, result.data, 200);
    });

  // Unified method to get product by id, sku, or slug using query parameters
  // If no parameters provided, returns all products
  getProduct = catchAsync(async (req, res) => {
    const { id, sku, slug } = req.query;
    
    let result;
    if (id) {
      // Always return product with variants when ID is provided
      result = await this.productService.getProductWithVariants(id);
    } else if (sku) {
      result = await this.productService.getProductBySku(sku);
    } else if (slug) {
      result = await this.productService.getProductBySlug(slug);
    } else {
      // No parameters provided - return all products (parent + variants)
      result = await this.productService.getAllProducts(req.query);
    }
    
    // Handle pagination if present
    if (result.pagination) {
      const responseData = { ...result.data, count: result.count || (Array.isArray(result.data) ? result.data.length : 0) };
      responseData.pagination = result.pagination;
      return sendSuccess(res, result.message, responseData, 200);
    }
    
    return sendSuccess(res, result.message, result.data, 200);
  });

  // Keep individual methods for backward compatibility
  getProductById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.productService.getProductById(id);
    return sendSuccess(res, result.message, result.data, 200);
  });

  getProductBySlug = catchAsync(async (req, res) => {
    const { slug } = req.params;
    const result = await this.productService.getProductBySlug(slug);
    return sendSuccess(res, result.message, result.data, 200);
  });

  getProductBySku = catchAsync(async (req, res) => {
    const { sku } = req.params;
    const result = await this.productService.getProductBySku(sku);
    return sendSuccess(res, result.message, result.data, 200);
  });

  getAllProducts = catchAsync(async (req, res) => {
    const filters = req.query;
    const result = await this.productService.getAllProducts(filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  getProductsWithPagination = catchAsync(async (req, res) => {
    const filters = req.query;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };
    const result = await this.productService.getProductsWithPagination(filters, options);
    return sendSuccess(res, result.message, result.data, 200);
  });

  updateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.productService.updateProduct(id, req.body);
    return sendSuccess(res, result.message, result.data, 200);
  });

  deleteProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.productService.deleteProduct(id);
    return sendSuccess(res, result.message, result.data, 200);
  });

  findCompatibleProducts = catchAsync(async (req, res) => {
    const vehicleFilters = req.query;
    const options = {
      page: parseInt(req.query.page) || null,
      limit: parseInt(req.query.limit) || null
    };
    
    const result = await this.productService.findCompatibleProducts(vehicleFilters, options);
    
    // Include pagination info if available
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    
    return sendSuccess(res, result.message, responseData, 200);
  });

  searchProducts = catchAsync(async (req, res) => {
    const { q, page, limit } = req.query;
    const options = {
      page: page ? parseInt(page) : null,
      limit: limit ? parseInt(limit) : null
    };
    const result = await this.productService.searchProducts(q, options);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  getFeaturedProducts = catchAsync(async (req, res) => {
    const { limit } = req.query;
    const result = await this.productService.getFeaturedProducts(parseInt(limit) || 10);
    return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
  });

  getNewArrivals = catchAsync(async (req, res) => {
    const { limit } = req.query;
    const result = await this.productService.getNewArrivals(parseInt(limit) || 10);
    return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
  });

  getBestSellers = catchAsync(async (req, res) => {
    const { limit } = req.query;
    const result = await this.productService.getBestSellers(parseInt(limit) || 10);
    return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
  });

  getAllNewArrivals = catchAsync(async (req, res) => {
    const filters = req.query;
    const result = await this.productService.getAllNewArrivals(filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  getProductsByCategory = catchAsync(async (req, res) => {
    const { categoryId } = req.query;
    const filters = req.query;
    const result = await this.productService.getProductsByCategory(categoryId, filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  getProductsByVehicle = catchAsync(async (req, res) => {
    const { vehicleId } = req.query;
    const filters = req.query;
    const result = await this.productService.getProductsByVehicle(vehicleId, filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  getProductsByBrand = catchAsync(async (req, res) => {
    const { brand } = req.query;
    const filters = req.query;
    const result = await this.productService.getProductsByBrand(brand, filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  getProductsByPartType = catchAsync(async (req, res) => {
    const { partType } = req.query;
    const filters = req.query;
    const result = await this.productService.getProductsByPartType(partType, filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  getProductsInStock = catchAsync(async (req, res) => {
    const filters = req.query;
    const result = await this.productService.getProductsInStock(filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  getProductsWithWarranty = catchAsync(async (req, res) => {
    const filters = req.query;
    const result = await this.productService.getProductsWithWarranty(filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  updateStock = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const result = await this.productService.updateStock(id, quantity);
    return sendSuccess(res, result.message, result.data, 200);
  });

  incrementViews = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.productService.incrementViews(id);
    return sendSuccess(res, result.message, result.data, 200);
  });

  incrementSalesCount = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const result = await this.productService.incrementSalesCount(id, quantity || 1);
    return sendSuccess(res, result.message, result.data, 200);
  });

  // Admin methods
  getAllProductsForAdmin = catchAsync(async (req, res) => {
    const filters = req.query;
    const result = await this.productService.getAllProductsForAdmin(filters);
    const responseData = Array.isArray(result.data) 
      ? { products: result.data, count: result.count }
      : { ...result.data, count: result.count };
    if (result.pagination) {
      responseData.pagination = result.pagination;
    }
    return sendSuccess(res, result.message, responseData, 200);
  });

  activateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.productService.activateProduct(id);
    return sendSuccess(res, result.message, null, 200);
  });

  deactivateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.productService.deactivateProduct(id);
    return sendSuccess(res, result.message, null, 200);
  });

  // Product variant methods
  // DEPRECATED - variants now handled in main product route
  // getProductVariants = catchAsync(async (req, res) => {
  //   // Implementation removed
  // });

  getProductWithVariants = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.productService.getProductWithVariants(id);
    return sendSuccess(res, result.message, result.data, 200);
  });

  // Create variant for a product
  createVariant = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const variantData = req.body;
    
    const result = await this.productService.createVariant(variantData, productId);
    return sendSuccess(res, result.message, result.data, 201);
  });

  // Update variant
  updateVariant = catchAsync(async (req, res) => {
    const { variantId } = req.params;
    const updateData = req.body;
    
    const result = await this.productService.updateVariant(variantId, updateData);
    return sendSuccess(res, result.message, result.data, 200);
  });

  // Delete variant
  deleteVariant = catchAsync(async (req, res) => {
    const { variantId } = req.params;
    
    const result = await this.productService.deleteVariant(variantId);
    return sendSuccess(res, result.message, null, 200);
  });
}

export default ProductController;