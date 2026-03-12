import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    default: ''
  },
  
  // Pricing
  pricing: {
    originalPrice: {
      type: Number,
      required: true
    },
    salePrice: {
      type: Number,
      default: null
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },

  // Images
  images: {
    primary: {
      type: String,
      default: null
    },
    gallery: [{
      type: String
    }]
  },

  // Category
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  // Suitable for (bikes) – which bike variants/models this product fits (e.g. Royal Enfield specific)
  suitableFor: {
    variantIds: [{
      type: Schema.Types.ObjectId,
      ref: 'VehicleVariant'
    }],
    modelIds: [{
      type: Schema.Types.ObjectId,
      ref: 'VehicleModel'
    }]
  },

  // Vehicle Compatibility - legacy/advanced
  compatibility: {
    type: {
      type: String,
      enum: ['specific', 'model_all', 'make_all', 'universal'],
      required: true
    },
    // For specific variants
    specificVariants: [{
      variantId: {
        type: Schema.Types.ObjectId,
        ref: 'VehicleVariant'
      },
      yearRange: {
        startYear: Number,
        endYear: Number
      }
    }],
    // For all variants of specific models
    compatibleModels: [{
      type: Schema.Types.ObjectId,
      ref: 'VehicleModel'
    }],
    // For all models of specific makes
    compatibleMakes: [{
      type: Schema.Types.ObjectId,
      ref: 'VehicleMake'
    }],
    // Compatibility notes
    notes: {
      type: String,
      default: ''
    }
  },

  // Product Features/Highlights
  features: [{
    type: String
  }],

  // Product Type & Fitment
  partType: {
    type: String,
    enum: ['Aftermarket', 'OEM', 'Genuine'],
    default: 'Aftermarket'
  },
  fitmentType: {
    type: String,
    default: ''
  },
  material: {
    type: String,
    default: ''
  },

  // Product Specifications (Dynamic key-value pairs)
  specifications: {
    type: Map,
    of: String
  },

  // Additional dynamic attributes
  additionalAttributes: {
    type: Map,
    of: Schema.Types.Mixed
  },

  // Inventory
  inventory: {
    stock: {
      type: Number,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    trackInventory: {
      type: Boolean,
      default: true
    }
  },

  // Product Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Variant fields
  isVariant: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: null
  },

  // Shipping & Return
  shippingInfo: {
    weight: {
      type: Number,
      default: 0
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    }
  },

  returnPolicy: {
    returnable: {
      type: Boolean,
      default: true
    },
    returnDays: {
      type: Number,
      default: 7
    }
  },

  // SEO
  seoMeta: {
    title: String,
    description: String,
    keywords: [String]
  },

  // Analytics
  views: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },

  // Product Variants - Array of variant IDs (deprecated - using isVariant and variant fields instead)
  // variants: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'ProductVariant'
  // }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ 'compatibility.specificVariants.variantId': 1 });
productSchema.index({ 'compatibility.compatibleModels': 1 });
productSchema.index({ 'compatibility.compatibleMakes': 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ 'pricing.salePrice': 1 });
productSchema.index({ 'inventory.stock': 1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ views: -1 });
productSchema.index({ isVariant: 1 });
productSchema.index({ variant: 1 });
productSchema.index({ 'suitableFor.variantIds': 1 });
productSchema.index({ 'suitableFor.modelIds': 1 });

// Virtual for category reference
productSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Virtual for compatible variants
productSchema.virtual('compatibleVariants', {
  ref: 'VehicleVariant',
  localField: 'compatibility.specificVariants.variantId',
  foreignField: '_id'
});

// Virtual for compatible models
productSchema.virtual('compatibleModels', {
  ref: 'VehicleModel',
  localField: 'compatibility.compatibleModels',
  foreignField: '_id'
});

// Virtual for compatible makes
productSchema.virtual('compatibleMakes', {
  ref: 'VehicleMake',
  localField: 'compatibility.compatibleMakes',
  foreignField: '_id'
});

// Virtuals for suitableFor (bikes) – populated for API responses
productSchema.virtual('suitableForVariants', {
  ref: 'VehicleVariant',
  localField: 'suitableFor.variantIds',
  foreignField: '_id'
});
productSchema.virtual('suitableForModels', {
  ref: 'VehicleModel',
  localField: 'suitableFor.modelIds',
  foreignField: '_id'
});

// Virtual for product variants (deprecated - using isVariant and variant fields instead)
// productSchema.virtual('productVariants', {
//   ref: 'ProductVariant',
//   localField: 'variants',
//   foreignField: '_id'
// });

// Virtual for current price
productSchema.virtual('currentPrice').get(function() {
  return this.pricing.salePrice || this.pricing.originalPrice;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.pricing.salePrice || this.pricing.salePrice >= this.pricing.originalPrice) {
    return 0;
  }
  return Math.round(((this.pricing.originalPrice - this.pricing.salePrice) / this.pricing.originalPrice) * 100);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.inventory.stock <= 0) return 'out_of_stock';
  if (this.inventory.stock <= this.inventory.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Method to generate structured SKU
productSchema.methods.generateStructuredSKU = function() {
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  // Try to create a structured SKU based on available data
  let sku = 'JG'; // Janatha Garage prefix
  
  // Add category prefix if available
  if (this.categoryId) {
    // We'll need to populate category to get its name
    // For now, use a generic prefix
    sku += '-PRD';
  }
  
  // Add part type prefix
  if (this.partType) {
    switch(this.partType) {
      case 'OEM':
        sku += '-OEM';
        break;
      case 'Genuine':
        sku += '-GEN';
        break;
      default:
        sku += '-AFT'; // Aftermarket
    }
  }
  
  // Add fitment type if available
  if (this.fitmentType) {
    const fitmentCode = this.fitmentType.substring(0, 3).toUpperCase();
    sku += `-${fitmentCode}`;
  }
  
  // Add timestamp and random string for uniqueness
  sku += `-${timestamp}-${randomStr}`;
  
  return sku;
};

// Pre-save middleware to generate slug and SKU if not provided
productSchema.pre('save', async function(next) {
  try {
    // Generate slug if not provided
    if (!this.slug && this.name) {
      let baseSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/(^-|-$)/g, '') // Remove leading/trailing hyphens
        .trim();
      
      // Check for duplicate slug and make it unique
      let slug = baseSlug;
      let counter = 1;
      let isNewDocument = !this._id;
      
      // Keep checking until we find a unique slug
      while (true) {
        const query = { slug };
        // If updating, exclude current document from duplicate check
        if (!isNewDocument) {
          query._id = { $ne: this._id };
        }
        
        const existingProduct = await this.constructor.findOne(query);
        
        if (!existingProduct) {
          // Slug is unique, use it
          break;
        }
        
        // Slug exists, append counter or timestamp to make it unique
        if (counter === 1) {
          slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
        } else {
          slug = `${baseSlug}-${Date.now().toString().slice(-6)}-${counter}`;
        }
        counter++;
        
        // Safety check to prevent infinite loop
        if (counter > 100) {
          slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          break;
        }
      }
      
      this.slug = slug;
    }
    
    // Generate SKU if not provided
    if (!this.sku) {
      this.sku = this.generateStructuredSKU();
    }
    
    // Ensure slug and SKU are set before validation
    if (!this.slug) {
      this.slug = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
    if (!this.sku) {
      this.sku = this.generateStructuredSKU();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

const Product = mongoose.model("Product", productSchema);
export default Product; 