import ProductRepository from '../repository/product.repository.js';
import { ProductEntity } from '../entity/product.entity.js';
import { uploadService } from '../../upload/services/upload.service.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

class ProductService {
  constructor() {
    this.productRepository = new ProductRepository();
  }

  async createProduct(productData) {
    try {
      // Basic validation (SKU and slug are now optional as they'll be auto-generated)
      if (!productData.name) {
        throw new Error('Product name is required');
      }
      if (!productData.description) {
        throw new Error('Product description is required');
      }
      if (!productData.pricing?.originalPrice) {
        throw new Error('Original price is required');
      }
      if (!productData.categoryId) {
        throw new Error('Category is required');
      }
      // Primary image is optional for now, can be added later
      // if (!productData.images?.primary) {
      //   throw new Error('Primary image is required');
      // }

      const product = await this.productRepository.create(productData);
      const productEntity = ProductEntity.fromModel(product);
      
      return {
        success: true,
        data: productEntity.toJSON(),
        message: 'Product created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async generateSlugAndSku(name, partType = 'Aftermarket', fitmentType = '') {
    try {
      if (!name) {
        throw new Error('Product name is required');
      }

      // Generate slug
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/(^-|-$)/g, '') // Remove leading/trailing hyphens
        .trim();

      // Generate structured SKU
      const timestamp = Date.now().toString().slice(-6);
      const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
      
      let sku = 'MG'; // Moosa Garage prefix
      
      // Add part type prefix
      switch(partType) {
        case 'OEM':
          sku += '-OEM';
          break;
        case 'Genuine':
          sku += '-GEN';
          break;
        default:
          sku += '-AFT'; // Aftermarket
      }
      
      // Add fitment type if available
      if (fitmentType) {
        const fitmentCode = fitmentType.substring(0, 3).toUpperCase();
        sku += `-${fitmentCode}`;
      }
      
      // Add timestamp and random string for uniqueness
      sku += `-${timestamp}-${randomStr}`;

      return {
        success: true,
        data: { slug, sku },
        message: 'Slug and SKU generated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getProductById(id) {
    try {
      console.log('🔍 [getProductById] Searching for product with ID:', id);
      console.log('🔍 [getProductById] ID type:', typeof id);
      console.log('🔍 [getProductById] MongoDB connection:', this.productRepository.constructor.name);
      
      const product = await this.productRepository.findById(id);
      
      console.log('🔍 [getProductById] Product found:', product ? 'YES' : 'NO');
      if (product) {
        console.log('🔍 [getProductById] Product name:', product.name);
        console.log('🔍 [getProductById] Product _id:', product._id);
        console.log('🔍 [getProductById] Product isActive:', product.isActive);
      }
      
      if (!product) {
        console.log('❌ [getProductById] Product not found for ID:', id);
        throw new Error('Product not found');
      }

      // Get all active variants for this product
      const variants = await this.productRepository.findVariantsByParentId(id);
      console.log('🔍 [getProductById] Variants found:', variants.length);
      
      const productEntity = ProductEntity.fromModel(product);
      const productData = productEntity.toJSON();
      
      // Add variants to product data
      productData.variants = variants.map(variant => {
        const variantEntity = ProductEntity.fromModel(variant);
        const variantData = variantEntity.toJSON();
        return {
          ...variantData,
          discountPercentage: variantData.pricing?.salePrice ? 
            Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0
        };
      });

      console.log('✅ [getProductById] Returning product data. Product ID in response:', productData.id);
      console.log('✅ [getProductById] Response structure:', {
        success: true,
        hasData: !!productData,
        dataKeys: Object.keys(productData),
        variantsCount: productData.variants?.length || 0
      });

      return {
        success: true,
        data: productData,
        message: 'Product retrieved successfully'
      };
    } catch (error) {
      console.error('❌ [getProductById] Error:', error.message);
      throw error;
    }
  }

  async getProductBySlug(slug) {
    try {
      const product = await this.productRepository.findBySlug(slug);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Get all active variants for this product
      const variants = await this.productRepository.findVariantsByParentId(product._id);
      
      const productEntity = ProductEntity.fromModel(product);
      const productData = productEntity.toJSON();
      
      // Add variants to product data
      productData.variants = variants.map(variant => {
        const variantEntity = ProductEntity.fromModel(variant);
        const variantData = variantEntity.toJSON();
        return {
          ...variantData,
          discountPercentage: variantData.pricing?.salePrice ? 
            Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0
        };
      });

      return {
        success: true,
        data: productData,
        message: 'Product retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getProductBySku(sku) {
    try {
      const product = await this.productRepository.findBySku(sku);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Get all active variants for this product
      const variants = await this.productRepository.findVariantsByParentId(product._id);
      
      const productEntity = ProductEntity.fromModel(product);
      const productData = productEntity.toJSON();
      
      // Add variants to product data
      productData.variants = variants.map(variant => {
        const variantEntity = ProductEntity.fromModel(variant);
        const variantData = variantEntity.toJSON();
        return {
          ...variantData,
          discountPercentage: variantData.pricing?.salePrice ? 
            Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0
        };
      });

      return {
        success: true,
        data: productData,
        message: 'Product retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllProducts(filters = {}) {
    try {
      const result = await this.productRepository.findAll(filters);
      
      // Check if result has pagination (object with data and pagination)
      if (result.data && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.data);
        let productData = productEntities.map(entity => entity.toJSON());
        
        // Include variants if requested
        if (filters.includeVariants === 'true') {
          for (let i = 0; i < productData.length; i++) {
            const variants = await this.productRepository.findVariantsByParentId(
              productData[i].id, 
              { includeInactive: false }
            );
            
            productData[i].variants = variants.map(variant => {
              const variantEntity = ProductEntity.fromModel(variant);
              const variantData = variantEntity.toJSON();
              return {
                ...variantData,
                discountPercentage: variantData.pricing?.salePrice ? 
                  Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0
              };
            });
          }
        }
        
        return {
          success: true,
          data: productData,
          pagination: result.pagination,
          message: 'Products retrieved successfully',
          count: productData.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        let productData = productEntities.map(entity => entity.toJSON());
        
        // Include variants if requested
        if (filters.includeVariants === 'true') {
          for (let i = 0; i < productData.length; i++) {
            const variants = await this.productRepository.findVariantsByParentId(
              productData[i].id, 
              { includeInactive: false }
            );
            
            productData[i].variants = variants.map(variant => {
              const variantEntity = ProductEntity.fromModel(variant);
              const variantData = variantEntity.toJSON();
              return {
                ...variantData,
                discountPercentage: variantData.pricing?.salePrice ? 
                  Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0
              };
            });
          }
        }
        
        return {
          success: true,
          data: productData,
          message: 'Products retrieved successfully',
          count: productData.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  // Admin method - get all products (active + inactive)
  async getAllProductsForAdmin(filters = {}) {
    try {
      const result = await this.productRepository.findAllForAdmin(filters);
      
      // Check if result has pagination (object with data and pagination)
      if (result.data && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.data);
        let productData = productEntities.map(entity => entity.toJSON());
        
        // Include variants if requested
        if (filters.includeVariants === 'true') {
          for (let i = 0; i < productData.length; i++) {
            const variants = await this.productRepository.findVariantsByParentId(
              productData[i].id, 
              { includeInactive: true } // Include inactive variants for admin
            );
            
            productData[i].variants = variants.map(variant => {
              const variantEntity = ProductEntity.fromModel(variant);
              const variantData = variantEntity.toJSON();
              return {
                ...variantData,
                discountPercentage: variantData.pricing?.salePrice ? 
                  Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0
              };
            });
          }
        }
        
        return {
          success: true,
          data: productData,
          pagination: result.pagination,
          message: 'All products retrieved successfully',
          count: productData.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        let productData = productEntities.map(entity => entity.toJSON());
        
        // Include variants if requested
        if (filters.includeVariants === 'true') {
          for (let i = 0; i < productData.length; i++) {
            const variants = await this.productRepository.findVariantsByParentId(
              productData[i].id, 
              { includeInactive: true } // Include inactive variants for admin
            );
            
            productData[i].variants = variants.map(variant => {
              const variantEntity = ProductEntity.fromModel(variant);
              const variantData = variantEntity.toJSON();
              return {
                ...variantData,
                discountPercentage: variantData.pricing?.salePrice ? 
                  Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0
              };
            });
          }
        }
        
        return {
          success: true,
          data: productData,
          message: 'All products retrieved successfully',
          count: productData.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  // Activate product
  async activateProduct(id) {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        throw new CustomError('Product not found', HttpStatusCode.NOT_FOUND, true);
      }

      await this.productRepository.updateById(id, { isActive: true });
      
      return {
        success: true,
        message: 'Product activated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Deactivate product
  async deactivateProduct(id) {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        throw new CustomError('Product not found', HttpStatusCode.NOT_FOUND, true);
      }

      await this.productRepository.updateById(id, { isActive: false });
      
      return {
        success: true,
        message: 'Product deactivated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get variants for a specific product - DEPRECATED
  // This method is deprecated - variants now handled in main product route
  // async getProductVariants(productId, filters = {}) {
  //   // Implementation removed
  // }

  // Get product with all its variants
  async getProductWithVariants(productId) {
    try {
      console.log('🔍 [getProductWithVariants] Searching for product with ID:', productId);
      console.log('🔍 [getProductWithVariants] ID type:', typeof productId);
      
      const product = await this.productRepository.findById(productId);
      
      console.log('🔍 [getProductWithVariants] Product found:', product ? 'YES' : 'NO');
      if (product) {
        console.log('🔍 [getProductWithVariants] Product name:', product.name);
        console.log('🔍 [getProductWithVariants] Product _id:', product._id);
        console.log('🔍 [getProductWithVariants] Product isActive:', product.isActive);
      }
      
      if (!product) {
        console.log('❌ [getProductWithVariants] Product not found for ID:', productId);
        throw new CustomError('Product not found', HttpStatusCode.NOT_FOUND, true);
      }

      // Get all active variants for this product
      const variants = await this.productRepository.findVariantsByParentId(productId);
      console.log('🔍 [getProductWithVariants] Variants found:', variants.length);
      
      const productEntity = ProductEntity.fromModel(product);
      const productData = productEntity.toJSON();
      
      console.log('✅ [getProductWithVariants] Product ID after conversion:', productData.id, 'Type:', typeof productData.id);
      
      // Map variants to the expected format
      const variantsData = variants.map(variant => {
        const variantEntity = ProductEntity.fromModel(variant);
        const variantData = variantEntity.toJSON();
        return {
          ...variantData,
          discountPercentage: variantData.pricing?.salePrice ? 
            Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0,
          stockStatus: variantData.inventory?.stock > 0 ? 'in_stock' : 'out_of_stock'
        };
      });

      // Remove variants from productData as we'll send it separately
      const { variants: _, ...productWithoutVariants } = productData;

      console.log('✅ [getProductWithVariants] Returning product data. Product ID in response:', productData.id);
      console.log('✅ [getProductWithVariants] Response structure:', {
        success: true,
        hasProduct: !!productWithoutVariants,
        hasVariants: variantsData.length > 0,
        variantsCount: variantsData.length
      });

      return {
        success: true,
        data: {
          product: productWithoutVariants,
          variants: variantsData
        },
        message: 'Product with variants retrieved successfully'
      };
    } catch (error) {
      console.error('❌ [getProductWithVariants] Error:', error.message);
      throw error;
    }
  }

  async getProductsWithPagination(filters = {}, options = {}) {
    try {
      const result = await this.productRepository.findWithPagination(filters, options);
      const productEntities = ProductEntity.fromModelList(result.data);
      
      let productData = productEntities.map(entity => entity.toJSON());
      
      // Include variants if requested
      if (filters.includeVariants === 'true') {
        for (let i = 0; i < productData.length; i++) {
          const variants = await this.productRepository.findVariantsByParentId(
            productData[i].id, 
            { includeInactive: false }
          );
          
          productData[i].variants = variants.map(variant => {
            const variantEntity = ProductEntity.fromModel(variant);
            const variantData = variantEntity.toJSON();
            return {
              ...variantData,
              discountPercentage: variantData.pricing?.salePrice ? 
                Math.round(((variantData.pricing.originalPrice - variantData.pricing.salePrice) / variantData.pricing.originalPrice) * 100) : 0
            };
          });
        }
      }
      
      return {
        success: true,
        data: productData,
        pagination: result.pagination,
        message: 'Products retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(id, updateData) {
    try {
      const existingProduct = await this.productRepository.findById(id);
      
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // If new primary image is provided, delete old primary image from Cloudinary
      if (updateData.images?.primary && existingProduct.images?.primary) {
        try {
          await uploadService.deleteFromCloudinaryByUrl(existingProduct.images.primary);
        } catch (error) {
          console.error('Error deleting old primary image:', error);
          // Continue with update even if deletion fails
        }
      }

      // If new gallery images are provided, delete old gallery images from Cloudinary
      if (updateData.images?.gallery && existingProduct.images?.gallery && existingProduct.images.gallery.length > 0) {
        try {
          for (const oldImageUrl of existingProduct.images.gallery) {
            await uploadService.deleteFromCloudinaryByUrl(oldImageUrl);
          }
        } catch (error) {
          console.error('Error deleting old gallery images:', error);
          // Continue with update even if deletion fails
        }
      }

      // Log the update data being sent
      console.log('📦 [updateProduct] Update data received:', {
        hasImages: !!updateData.images,
        hasGallery: !!updateData.images?.gallery,
        galleryCount: updateData.images?.gallery?.length || 0,
        gallery: updateData.images?.gallery
      });

      const product = await this.productRepository.updateById(id, updateData);
      
      // Log the result
      console.log('✅ [updateProduct] Product updated:', {
        id: product._id,
        galleryCount: product.images?.gallery?.length || 0,
        gallery: product.images?.gallery
      });
      const productEntity = ProductEntity.fromModel(product);
      
      return {
        success: true,
        data: productEntity.toJSON(),
        message: 'Product updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const existingProduct = await this.productRepository.findById(id);
      
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Delete primary image from Cloudinary before deleting the record
      if (existingProduct.images?.primary) {
        try {
          await uploadService.deleteFromCloudinaryByUrl(existingProduct.images.primary);
        } catch (error) {
          console.error('Error deleting primary image from Cloudinary:', error);
          // Continue with deletion even if image deletion fails
        }
      }

      // Delete gallery images from Cloudinary before deleting the record
      if (existingProduct.images?.gallery) {
        try {
          for (const imageUrl of existingProduct.images.gallery) {
            await uploadService.deleteFromCloudinaryByUrl(imageUrl);
        }
      } catch (error) {
          console.error('Error deleting gallery images from Cloudinary:', error);
        // Continue with deletion even if image deletion fails
      }
    }

      const product = await this.productRepository.deleteById(id);
      const productEntity = ProductEntity.fromModel(product);
      
      return {
        success: true,
        data: productEntity.toJSON(),
        message: 'Product deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async findCompatibleProducts(vehicleFilters = {}, options = {}) {
    try {
      const result = await this.productRepository.findCompatibleProducts(vehicleFilters, options);
      
      // Handle paginated response
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Compatible products retrieved successfully',
          count: productEntities.length,
          pagination: result.pagination
        };
      } else {
        // Handle non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Compatible products retrieved successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async searchProducts(searchTerm, options = {}) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new Error('Search term is required');
      }

      const result = await this.productRepository.searchProducts(searchTerm.trim(), options);
      
      // Check if result has pagination (object with products and pagination)
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          pagination: result.pagination,
          message: 'Product search completed successfully',
          count: productEntities.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Product search completed successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getFeaturedProducts(limit = 10) {
    try {
      const products = await this.productRepository.getFeaturedProducts(limit);
      const productEntities = ProductEntity.fromModelList(products);
      
      return {
        success: true,
        data: productEntities.map(entity => entity.toJSON()),
        message: 'Featured products retrieved successfully',
        count: productEntities.length
      };
    } catch (error) {
      throw error;
    }
  }

  async getNewArrivals(limit = 10) {
    try {
      const products = await this.productRepository.getNewArrivals(limit);
      const productEntities = ProductEntity.fromModelList(products);
      
      return {
        success: true,
        data: productEntities.map(entity => entity.toJSON()),
        message: 'New arrivals retrieved successfully',
        count: productEntities.length
      };
    } catch (error) {
      throw error;
    }
  }

  async getBestSellers(limit = 10) {
    try {
      const products = await this.productRepository.getBestSellers(limit);
      const productEntities = ProductEntity.fromModelList(products);
      
      return {
        success: true,
        data: productEntities.map(entity => entity.toJSON()),
        message: 'Best sellers retrieved successfully',
        count: productEntities.length
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllNewArrivals(filters = {}) {
    try {
      const result = await this.productRepository.getAllNewArrivals(filters);
      
      // Check if result has pagination (object with products and pagination)
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          pagination: result.pagination,
          message: 'All new arrivals retrieved successfully',
          count: productEntities.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'All new arrivals retrieved successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getProductsByCategory(categoryId, filters = {}) {
    try {
      if (!categoryId) {
        throw new Error('Category ID is required');
      }
      
      const result = await this.productRepository.getProductsByCategory(categoryId, filters);
      
      // Check if result has pagination (object with products and pagination)
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          pagination: result.pagination,
          message: 'Products by category retrieved successfully',
          count: productEntities.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Products by category retrieved successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getProductsByVehicle(vehicleId, filters = {}) {
    try {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }
      
      const result = await this.productRepository.getProductsByVehicle(vehicleId, filters);
      
      // Check if result has pagination (object with products and pagination)
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          pagination: result.pagination,
          message: 'Products by vehicle retrieved successfully',
          count: productEntities.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Products by vehicle retrieved successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getProductsByBrand(brand, filters = {}) {
    try {
      if (!brand) {
        throw new Error('Brand is required');
      }
      
      const result = await this.productRepository.getProductsByBrand(brand, filters);
      
      // Check if result has pagination (object with products and pagination)
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          pagination: result.pagination,
          message: 'Products by brand retrieved successfully',
          count: productEntities.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Products by brand retrieved successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getProductsByPartType(partType, filters = {}) {
    try {
      if (!partType) {
        throw new Error('Part type is required');
      }
      
      const result = await this.productRepository.getProductsByPartType(partType, filters);
      
      // Check if result has pagination (object with products and pagination)
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          pagination: result.pagination,
          message: 'Products by part type retrieved successfully',
          count: productEntities.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Products by part type retrieved successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getProductsInStock(filters = {}) {
    try {
      const result = await this.productRepository.getProductsInStock(filters);
      
      // Check if result has pagination (object with products and pagination)
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          pagination: result.pagination,
          message: 'Products in stock retrieved successfully',
          count: productEntities.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Products in stock retrieved successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async getProductsWithWarranty(filters = {}) {
    try {
      const result = await this.productRepository.getProductsWithWarranty(filters);
      
      // Check if result has pagination (object with products and pagination)
      if (result.products && result.pagination) {
        const productEntities = ProductEntity.fromModelList(result.products);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          pagination: result.pagination,
          message: 'Products with warranty retrieved successfully',
          count: productEntities.length
        };
      } else {
        // Non-paginated response (backward compatibility)
        const productEntities = ProductEntity.fromModelList(result);
        
        return {
          success: true,
          data: productEntities.map(entity => entity.toJSON()),
          message: 'Products with warranty retrieved successfully',
          count: productEntities.length
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async updateStock(productId, quantity) {
    try {
      const product = await this.productRepository.updateStock(productId, quantity);
      const productEntity = ProductEntity.fromModel(product);
      
      return {
        success: true,
        data: productEntity.toJSON(),
        message: 'Stock updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async incrementViews(productId) {
    try {
      const product = await this.productRepository.incrementViews(productId);
      const productEntity = ProductEntity.fromModel(product);
      
      return {
        success: true,
        data: productEntity.toJSON(),
        message: 'Views incremented successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async incrementSalesCount(productId, quantity = 1) {
    try {
      const product = await this.productRepository.incrementSalesCount(productId, quantity);
      const productEntity = ProductEntity.fromModel(product);
      
      return {
        success: true,
        data: productEntity.toJSON(),
        message: 'Sales count incremented successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // ==================== VARIANT MANAGEMENT METHODS ====================
  // Note: getProductWithVariants is defined above at line 347

  async addVariantToProduct(productId, variantData) {
    try {
      // Validate product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.isActive) {
        throw new Error('Cannot add variants to inactive product');
      }

      // Add productId to variant data
      const variantWithProductId = {
        ...variantData,
        productId
      };

      // Create variant
      const variant = await this.productVariantRepository.create(variantWithProductId);

      // Add variant ID to product's variants array
      await this.productRepository.updateById(productId, {
        $addToSet: { variants: variant._id }
      });

      return {
        success: true,
        data: variant,
        message: 'Variant added to product successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async removeVariantFromProduct(productId, variantId) {
    try {
      // Validate product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Validate variant exists and belongs to this product
      const variant = await this.productVariantRepository.findById(variantId);
      if (!variant) {
        throw new Error('Variant not found');
      }

      if (variant.productId.toString() !== productId) {
        throw new Error('Variant does not belong to this product');
      }

      // Soft delete the variant
      await this.productVariantRepository.deleteById(variantId);

      // Remove variant ID from product's variants array
      await this.productRepository.updateById(productId, {
        $pull: { variants: variantId }
      });

      return {
        success: true,
        data: { variantId },
        message: 'Variant removed from product successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // DEPRECATED - variants now handled in main product route
  // async getProductVariants(productId, filters = {}) {
  //   // Implementation removed
  // }

  async getDefaultVariantForProduct(productId) {
    try {
      // Validate product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const defaultVariant = await this.productVariantRepository.findDefaultForProduct(productId);
      if (!defaultVariant) {
        throw new Error('No default variant found for this product');
      }

      return {
        success: true,
        data: defaultVariant,
        message: 'Default variant retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async setDefaultVariantForProduct(productId, variantId) {
    try {
      // Validate product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Validate variant exists and belongs to this product
      const variant = await this.productVariantRepository.findById(variantId);
      if (!variant) {
        throw new Error('Variant not found');
      }

      if (variant.productId.toString() !== productId) {
        throw new Error('Variant does not belong to this product');
      }

      // Set as default variant
      await this.productVariantRepository.setAsDefault(variantId);

      return {
        success: true,
        data: { variantId },
        message: 'Default variant set successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateVariantStock(variantId, quantity, operation = 'decrease') {
    try {
      const variant = await this.productVariantRepository.updateStock(variantId, quantity, operation);
      
      return {
        success: true,
        data: variant,
        message: `Variant stock ${operation === 'decrease' ? 'decreased' : 'increased'} successfully`
      };
    } catch (error) {
      throw error;
    }
  }

  async bulkAddVariantsToProduct(productId, variantsData) {
    try {
      // Validate product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.isActive) {
        throw new Error('Cannot add variants to inactive product');
      }

      if (!Array.isArray(variantsData) || variantsData.length === 0) {
        throw new Error('Variants data array is required');
      }

      const createdVariants = [];
      const errors = [];

      for (let i = 0; i < variantsData.length; i++) {
        try {
          const variantData = {
            ...variantsData[i],
            productId
          };

          const variant = await this.productVariantRepository.create(variantData);
          createdVariants.push(variant);

          // Add variant ID to product's variants array
          await this.productRepository.updateById(productId, {
            $addToSet: { variants: variant._id }
          });
        } catch (error) {
          errors.push({
            index: i,
            error: error.message,
            data: variantsData[i]
          });
        }
      }

      return {
        success: errors.length === 0,
        data: {
          created: createdVariants,
          errors: errors
        },
        message: `Bulk variant creation completed. ${createdVariants.length} variants created, ${errors.length} failed`
      };
    } catch (error) {
      throw error;
    }
  }

  async getProductVariantStats(productId) {
    try {
      // Validate product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const variants = await this.productRepository.findVariantsByParentId(productId, { includeInactive: true });
      
      const stats = {
        totalVariants: variants.length,
        activeVariants: variants.filter(v => v.isActive).length,
        inactiveVariants: variants.filter(v => !v.isActive).length,
        defaultVariants: variants.filter(v => v.isDefault).length,
        variantsWithDiscount: variants.filter(v => v.pricing.salePrice && v.pricing.salePrice > 0).length,
        totalStock: variants.reduce((sum, v) => sum + (v.inventory.stock || 0), 0),
        lowStockVariants: variants.filter(v => v.inventory.stock > 0 && v.inventory.stock <= v.inventory.lowStockThreshold).length,
        outOfStockVariants: variants.filter(v => v.inventory.stock === 0).length,
        inStockVariants: variants.filter(v => v.inventory.stock > v.inventory.lowStockThreshold).length
      };

      return {
        success: true,
        data: stats,
        message: 'Product variant statistics retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // New methods for variant handling
  async getVariantsByParentId(parentId) {
    try {
      const variants = await this.productRepository.findVariantsByParentId(parentId);
      const variantEntities = variants.map(variant => ProductEntity.fromModel(variant));

      return {
        success: true,
        message: 'Variants retrieved successfully',
        data: variantEntities.map(v => v.toJSON())
      };
    } catch (error) {
      throw error;
    }
  }

  async createVariant(variantData, parentId) {
    try {
      // Validate parent product exists
      const parentProduct = await this.productRepository.findById(parentId);
      if (!parentProduct) {
        throw new Error('Parent product not found');
      }

      // Set variant fields
      variantData.isVariant = true;
      variantData.variant = parentId;
      
      // Set required fields if not provided
      if (!variantData.categoryId) {
        variantData.categoryId = parentProduct.categoryId;
      }
      if (!variantData.compatibility) {
        variantData.compatibility = {
          type: 'universal',
          specificVariants: [],
          compatibleModels: [],
          compatibleMakes: [],
          notes: ''
        };
      }
      if (!variantData.features) {
        variantData.features = [];
      }
      if (!variantData.partType) {
        variantData.partType = 'Aftermarket';
      }
      if (!variantData.specifications) {
        variantData.specifications = {};
      }
      if (!variantData.additionalAttributes) {
        variantData.additionalAttributes = {};
      }
      if (!variantData.seoMeta) {
        variantData.seoMeta = {
          title: '',
          description: '',
          keywords: []
        };
      }

      const variant = await this.productRepository.create(variantData);
      const variantEntity = ProductEntity.fromModel(variant);
      
      return {
        success: true,
        data: variantEntity.toJSON(),
        message: 'Variant created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateVariant(variantId, updateData) {
    try {
      // Ensure variant fields are not changed
      delete updateData.isVariant;
      delete updateData.variant;

      const variant = await this.productRepository.update(variantId, updateData);
      if (!variant) {
        throw new Error('Variant not found');
      }

      const variantEntity = ProductEntity.fromModel(variant);
      
      return {
        success: true,
        data: variantEntity.toJSON(),
        message: 'Variant updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteVariant(variantId) {
    try {
      const variant = await this.productRepository.findById(variantId);
      if (!variant) {
        throw new Error('Variant not found');
      }

      if (!variant.isVariant) {
        throw new Error('Product is not a variant');
      }

      await this.productRepository.delete(variantId);
      
      return {
        success: true,
        message: 'Variant deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }
}

export default ProductService;