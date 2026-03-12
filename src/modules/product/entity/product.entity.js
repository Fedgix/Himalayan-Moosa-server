import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

export class ProductEntity {
  constructor(data = {}) {
    // Convert ObjectId to string if it exists
    const idValue = data._id || data.id || null;
    this.id = idValue ? (idValue.toString ? idValue.toString() : String(idValue)) : null;
    this.name = data.name || '';
    this.slug = data.slug || '';
    this.sku = data.sku || '';
    this.brand = data.brand || '';
    this.description = data.description || '';
    this.shortDescription = data.shortDescription || '';
    
    // Pricing
    this.pricing = {
      originalPrice: data.pricing?.originalPrice || 0,
      salePrice: data.pricing?.salePrice || null,
      currency: data.pricing?.currency || 'INR'
    };

    // Images
    this.images = {
      primary: data.images?.primary || '',
      gallery: data.images?.gallery || []
    };

    // Category - Convert ObjectId to string if needed
    const categoryIdValue = data.categoryId || null;
    this.categoryId = categoryIdValue ? (categoryIdValue.toString ? categoryIdValue.toString() : String(categoryIdValue)) : null;
    this.category = data.category || null;

    // Suitable for (bikes) – variantIds, modelIds; populated: suitableForVariants, suitableForModels
    this.suitableFor = {
      variantIds: (data.suitableFor?.variantIds || []).map(id => (id && id.toString ? id.toString() : String(id))),
      modelIds: (data.suitableFor?.modelIds || []).map(id => (id && id.toString ? id.toString() : String(id)))
    };
    this.suitableForVariants = data.suitableForVariants || [];
    this.suitableForModels = data.suitableForModels || [];

    // Vehicle Compatibility
    this.compatibility = {
      type: data.compatibility?.type || 'universal',
      specificVariants: data.compatibility?.specificVariants || [],
      compatibleModels: data.compatibility?.compatibleModels || [],
      compatibleMakes: data.compatibility?.compatibleMakes || [],
      notes: data.compatibility?.notes || ''
    };

    // Features and Specifications
    this.features = data.features || [];
    this.specifications = data.specifications || new Map();
    this.additionalAttributes = data.additionalAttributes || new Map();

    // Product Type & Fitment
    this.partType = data.partType || 'Aftermarket';
    this.fitmentType = data.fitmentType || '';
    this.material = data.material || '';

    // Inventory
    this.inventory = {
      stock: data.inventory?.stock || 0,
      lowStockThreshold: data.inventory?.lowStockThreshold || 5,
      trackInventory: data.inventory?.trackInventory !== undefined ? data.inventory.trackInventory : true
    };

    // Product Status
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isFeatured = data.isFeatured !== undefined ? data.isFeatured : false;

    // Shipping & Return
    this.shippingInfo = {
      weight: data.shippingInfo?.weight || 0,
      dimensions: data.shippingInfo?.dimensions || {
        length: null,
        width: null,
        height: null
      },
      freeShipping: data.shippingInfo?.freeShipping !== undefined ? data.shippingInfo.freeShipping : false
    };

    this.returnPolicy = {
      returnable: data.returnPolicy?.returnable !== undefined ? data.returnPolicy.returnable : true,
      returnDays: data.returnPolicy?.returnDays || 7
    };

    // SEO
    this.seoMeta = data.seoMeta || {
      title: '',
      description: '',
      keywords: []
    };

    // Analytics
    this.views = data.views || 0;
    this.salesCount = data.salesCount || 0;

    // Product Variants
    this.variants = data.variants || [];

    // Timestamps
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;

    // Virtuals
    this.currentPrice = data.currentPrice || this.pricing.salePrice || this.pricing.originalPrice;
    this.discountPercentage = data.discountPercentage || 0;
    this.stockStatus = data.stockStatus || 'in_stock';
  }

  static fromModel(model) {
    if (!model) return null;
    return new ProductEntity(model.toObject());
  }

  static fromModelList(models) {
    return models.map(model => ProductEntity.fromModel(model));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      sku: this.sku,
      brand: this.brand,
      description: this.description,
      shortDescription: this.shortDescription,
      pricing: this.pricing,
      images: this.images,
      categoryId: this.categoryId,
      category: this.category,
      suitableFor: this.suitableFor,
      suitableForVariants: this.suitableForVariants,
      suitableForModels: this.suitableForModels,
      compatibility: this.compatibility,
      features: this.features,
      specifications: Object.fromEntries(this.specifications),
      additionalAttributes: Object.fromEntries(this.additionalAttributes),
      partType: this.partType,
      fitmentType: this.fitmentType,
      material: this.material,
      inventory: this.inventory,
      stock: this.inventory?.stock || 0, // Add stock field for easy access
      isActive: this.isActive,
      isFeatured: this.isFeatured,
      shippingInfo: this.shippingInfo,
      returnPolicy: this.returnPolicy,
      seoMeta: this.seoMeta,
      views: this.views,
      salesCount: this.salesCount,
      variants: this.variants,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      currentPrice: this.currentPrice,
      discountPercentage: this.discountPercentage,
      stockStatus: this.stockStatus
    };
  }

  toCreateDTO() {
    return {
      name: this.name,
      slug: this.slug,
      sku: this.sku,
      brand: this.brand,
      description: this.description,
      shortDescription: this.shortDescription,
      pricing: this.pricing,
      images: this.images,
      categoryId: this.categoryId,
      suitableFor: this.suitableFor,
      compatibility: this.compatibility,
      features: this.features,
      specifications: Object.fromEntries(this.specifications),
      additionalAttributes: Object.fromEntries(this.additionalAttributes),
      partType: this.partType,
      fitmentType: this.fitmentType,
      material: this.material,
      inventory: this.inventory,
      isActive: this.isActive,
      isFeatured: this.isFeatured,
      shippingInfo: this.shippingInfo,
      returnPolicy: this.returnPolicy,
      seoMeta: this.seoMeta
    };
  }

  toUpdateDTO() {
    const dto = {};
    if (this.name !== undefined) dto.name = this.name;
    if (this.slug !== undefined) dto.slug = this.slug;
    if (this.sku !== undefined) dto.sku = this.sku;
    if (this.brand !== undefined) dto.brand = this.brand;
    if (this.description !== undefined) dto.description = this.description;
    if (this.shortDescription !== undefined) dto.shortDescription = this.shortDescription;
    if (this.pricing !== undefined) dto.pricing = this.pricing;
    if (this.images !== undefined) dto.images = this.images;
    if (this.categoryId !== undefined) dto.categoryId = this.categoryId;
    if (this.suitableFor !== undefined) dto.suitableFor = this.suitableFor;
    if (this.compatibility !== undefined) dto.compatibility = this.compatibility;
    if (this.features !== undefined) dto.features = this.features;
    if (this.specifications !== undefined) dto.specifications = Object.fromEntries(this.specifications);
    if (this.additionalAttributes !== undefined) dto.additionalAttributes = Object.fromEntries(this.additionalAttributes);
    if (this.partType !== undefined) dto.partType = this.partType;
    if (this.fitmentType !== undefined) dto.fitmentType = this.fitmentType;
    if (this.material !== undefined) dto.material = this.material;
    if (this.inventory !== undefined) dto.inventory = this.inventory;
    if (this.isActive !== undefined) dto.isActive = this.isActive;
    if (this.isFeatured !== undefined) dto.isFeatured = this.isFeatured;
    if (this.shippingInfo !== undefined) dto.shippingInfo = this.shippingInfo;
    if (this.returnPolicy !== undefined) dto.returnPolicy = this.returnPolicy;
    if (this.seoMeta !== undefined) dto.seoMeta = this.seoMeta;
    return dto;
  }
}