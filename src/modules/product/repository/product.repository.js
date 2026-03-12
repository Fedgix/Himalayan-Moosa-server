import Product from '../models/product.model.js';

class ProductRepository {
  async create(productData) {
    try {
      const product = new Product(productData);
      const savedProduct = await product.save();
      return savedProduct;
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      const product = await Product.findById(id)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes');
      return product;
    } catch (error) {
      throw error;
    }
  }

  async findBySlug(slug) {
    try {
      const product = await Product.findOne({ slug, isActive: true })
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes');
      return product;
    } catch (error) {
      throw error;
    }
  }

  async findBySku(sku) {
    try {
      const product = await Product.findOne({ sku, isActive: true })
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes');
    return product;
    } catch (error) {
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      const query = { isActive: true };
      
      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
      }
      
      if (filters.slug) {
        query.slug = filters.slug;
      }
      
      if (filters.sku) {
        query.sku = filters.sku;
      }
      
      if (filters.categoryId) {
        query.categoryId = filters.categoryId;
      }
      if (filters.suitableForVariantId) {
        query['suitableFor.variantIds'] = filters.suitableForVariantId;
      }
      if (filters.suitableForModelId) {
        query['suitableFor.modelIds'] = filters.suitableForModelId;
      }
      
      if (filters.isFeatured !== undefined) {
        query.isFeatured = filters.isFeatured;
      }
      
      if (filters.minPrice !== undefined) {
        query['pricing.originalPrice'] = { $gte: filters.minPrice };
      }
      
      if (filters.maxPrice !== undefined) {
        query['pricing.originalPrice'] = { ...query['pricing.originalPrice'], $lte: filters.maxPrice };
      }
      
      if (filters.hasDiscount) {
        query['pricing.salePrice'] = { $ne: null };
      }
      
      if (filters.inStock) {
        query['inventory.stock'] = { $gt: 0 };
      }

      // Check if pagination is requested
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [data, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }

      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async findAllForAdmin(filters = {}) {
    try {
      const query = {}; // No isActive filter for admin
      
      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
      }
      
      if (filters.slug) {
        query.slug = filters.slug;
      }
      
      if (filters.sku) {
        query.sku = filters.sku;
      }
      
      if (filters.categoryId) {
        query.categoryId = filters.categoryId;
      }
      if (filters.suitableForVariantId) {
        query['suitableFor.variantIds'] = filters.suitableForVariantId;
      }
      if (filters.suitableForModelId) {
        query['suitableFor.modelIds'] = filters.suitableForModelId;
      }
      
      if (filters.isFeatured !== undefined) {
        query.isFeatured = filters.isFeatured;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.minPrice !== undefined) {
        query['pricing.originalPrice'] = { $gte: filters.minPrice };
      }
      
      if (filters.maxPrice !== undefined) {
        query['pricing.originalPrice'] = { ...query['pricing.originalPrice'], $lte: filters.maxPrice };
      }
      
      if (filters.hasDiscount) {
        query['pricing.salePrice'] = { $ne: null };
      }
      
      if (filters.inStock) {
        query['inventory.stock'] = { $gt: 0 };
      }

      // Check if pagination is requested
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [data, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }

      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async findWithPagination(filter = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
  
      const [data, total] = await Promise.all([
        Product.find(filter)
          .populate('category')
          .populate('suitableForVariants')
          .populate('suitableForModels')
          .populate('compatibleVariants')
          .populate('compatibleModels')
          .populate('compatibleMakes')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Product.countDocuments(filter)
      ]);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async updateById(id, updateData) {
    try {
      console.log('🔄 [updateById] Updating product:', id);
      console.log('📋 [updateById] Update data:', {
        hasImages: !!updateData.images,
        gallery: updateData.images?.gallery,
        galleryCount: updateData.images?.gallery?.length || 0
      });
      
      // Find the document first
      const product = await Product.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Apply updates directly to the document
      Object.keys(updateData).forEach(key => {
        if (key.startsWith('$')) {
          // Skip MongoDB operators
          return;
        }
        
        if (key === 'images' && updateData.images) {
          // Handle images object specially to ensure gallery array is properly set
          if (updateData.images.primary !== undefined) {
            product.images.primary = updateData.images.primary;
          }
          if (updateData.images.gallery !== undefined) {
            // Ensure gallery is properly set as an array
            product.images.gallery = Array.isArray(updateData.images.gallery) 
              ? updateData.images.gallery 
              : [];
            console.log('📝 [updateById] Set gallery array:', product.images.gallery);
          }
          // CRITICAL: Mark the nested images object as modified so Mongoose saves it
          product.markModified('images');
        } else {
          product[key] = updateData[key];
        }
      });
      
      console.log('💾 [updateById] About to save product. Gallery before save:', product.images?.gallery);
      
      // Save the document to persist changes
      await product.save();
      
      console.log('✅ [updateById] Product saved. Verifying...');
      
      // Reload with populate
      const updatedProduct = await Product.findById(id)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes');
      
      console.log('✅ [updateById] Product updated and saved successfully');
      console.log('📸 [updateById] Images after save (from DB):', {
        primary: updatedProduct?.images?.primary,
        galleryCount: updatedProduct?.images?.gallery?.length || 0,
        gallery: updatedProduct?.images?.gallery
      });
      
      // Double-check by querying again without populate
      const rawProduct = await Product.findById(id).lean();
      console.log('🔍 [updateById] Raw product from DB (lean query):', {
        id: rawProduct?._id,
        galleryCount: rawProduct?.images?.gallery?.length || 0,
        gallery: rawProduct?.images?.gallery
      });
      
      return updatedProduct;
    } catch (error) {
      console.error('❌ [updateById] Error updating product:', error);
      throw error;
    }
  }

  async deleteById(id) {
    try {
      const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
  
    return product;
    } catch (error) {
      throw error;
    }
  }

  async findCompatibleProducts(vehicleFilters = {}, options = {}) {
    try {
      const query = { isActive: true };
      
      if (vehicleFilters.variantId) {
        query['compatibility.specificVariants.variantId'] = vehicleFilters.variantId;
      }
      
      if (vehicleFilters.modelId) {
        query['compatibility.compatibleModels'] = vehicleFilters.modelId;
      }
      
      if (vehicleFilters.makeId) {
        query['compatibility.compatibleMakes'] = vehicleFilters.makeId;
      }
      
      if (vehicleFilters.year) {
        query['compatibility.specificVariants.yearRange.startYear'] = { $lte: vehicleFilters.year };
        query['compatibility.specificVariants.yearRange.endYear'] = { $gte: vehicleFilters.year };
      }

      // Check if pagination is requested
      if (options.page || options.limit) {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }

      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async searchProducts(searchTerm, options = {}) {
    try {
      const query = {
        $and: [
          { isActive: true },
          {
            $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { description: { $regex: searchTerm, $options: 'i' } },
              { sku: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        ]
      };

      // Check if pagination is requested
      if (options.page || options.limit) {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }

      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes');
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getFeaturedProducts(limit = 10) {
    try {
      const products = await Product.find({ 
        isActive: true, 
        isFeatured: true 
      })
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 })
        .limit(limit);
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getNewArrivals(limit = 10) {
    try {
      const products = await Product.find({ isActive: true })
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 })
        .limit(limit);
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getBestSellers(limit = 10) {
    try {
      const products = await Product.find({ isActive: true })
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ salesCount: -1 })
        .limit(limit);
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getAllNewArrivals(filters = {}) {
    try {
      const query = { isActive: true };
      
      // Apply filters
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
      
      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getProductsByCategory(categoryId, filters = {}) {
    try {
      const query = { 
        isActive: true,
        categoryId: categoryId
      };
      
      // Apply filters
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
  
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
      
      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getProductsByVehicle(vehicleId, filters = {}) {
    try {
      const query = { 
        isActive: true,
        $or: [
          { 'compatibility.specificVariants.variantId': vehicleId },
          { 'compatibility.compatibleModels': vehicleId },
          { 'compatibility.compatibleMakes': vehicleId }
        ]
      };
      
      // Apply filters
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
      
      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getProductsByBrand(brand, filters = {}) {
    try {
      const query = { 
        isActive: true,
        brand: { $regex: brand, $options: 'i' }
      };
      
      // Apply filters
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
      
      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getProductsByPartType(partType, filters = {}) {
    try {
      const query = { 
        isActive: true,
        partType: { $regex: partType, $options: 'i' }
      };
      
      // Apply filters
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
  
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
      
      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getProductsInStock(filters = {}) {
    try {
      const query = { 
        isActive: true,
        'inventory.stock': { $gt: 0 }
      };
      
      // Apply filters
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
      
      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async getProductsWithWarranty(filters = {}) {
    try {
      const query = { 
        isActive: true,
        warranty: { $exists: true, $ne: null, $ne: '' }
      };
      
      // Apply filters
      if (filters.page || filters.limit) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const skip = (page - 1) * limit;
        
        const [products, total] = await Promise.all([
          Product.find(query)
            .populate('category')
            .populate('suitableForVariants')
            .populate('suitableForModels')
            .populate('compatibleVariants')
            .populate('compatibleModels')
            .populate('compatibleMakes')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          Product.countDocuments(query)
        ]);
        
        return {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      }
      
      const products = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return products;
    } catch (error) {
      throw error;
    }
  }

  async updateStock(productId, quantity) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { 'inventory.stock': -quantity } },
        { new: true, runValidators: true }
      );
      
      return product;
    } catch (error) {
      throw error;
    }
  }

  async incrementViews(productId) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { views: 1 } },
        { new: true }
      );
      
      return product;
    } catch (error) {
      throw error;
    }
  }

  async incrementSalesCount(productId, quantity = 1) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { salesCount: quantity } },
        { new: true }
      );
      
      return product;
    } catch (error) {
      throw error;
    }
  }

  async findVariantsByParentId(parentId, options = {}) {
    try {
      const query = {
        isVariant: true,
        variant: parentId
      };
      
      // Only filter by isActive if includeInactive is not true
      if (!options.includeInactive) {
        query.isActive = true;
      }
      
      const variants = await Product.find(query)
        .populate('category')
        .populate('suitableForVariants')
        .populate('suitableForModels')
        .populate('compatibleVariants')
        .populate('compatibleModels')
        .populate('compatibleMakes')
        .sort({ createdAt: -1 });
      
      return variants;
    } catch (error) {
      throw error;
    }
  }
}

export default ProductRepository;