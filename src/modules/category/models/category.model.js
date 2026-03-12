import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String, // Category image URL
    default: null
  },
  icon: {
    type: String, // Icon class or URL
    default: null
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0 // 0 for main categories, 1 for subcategories, etc.
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  seoMeta: {
    title: String,
    description: String,
    keywords: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ level: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Virtual for parent category
categorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentCategory',
  foreignField: '_id',
  justOne: true
});

// Virtual for product count
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

// Virtual for products
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId'
});

// Pre-save middleware to generate slug if not provided
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  // Set level based on parent category
  if (this.parentCategory) {
    this.level = 1;
  } else {
    this.level = 0;
  }
  
  next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category; 