import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './src/modules/product/models/product.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.development') });

// Connect to MongoDB (uses MONGO_URI from server/.env.development)
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ Set MONGO_URI in server/.env.development');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix the specific variant
const fixVariant = async () => {
  try {
    console.log('Fixing variant structure...');
    
    const variantId = '68d88da7c581f5ec2111a2d5';
    const parentId = '68a9f606e8fd683cd4ff3d47';
    
    // Update the variant to new structure
    const result = await Product.findByIdAndUpdate(variantId, {
      $set: {
        isVariant: true,
        variant: parentId,
        // Add missing fields for proper product structure
        shortDescription: '',
        categoryId: null,
        compatibility: {
          type: 'universal',
          specificVariants: [],
          compatibleModels: [],
          compatibleMakes: [],
          notes: ''
        },
        features: [],
        partType: 'Aftermarket',
        fitmentType: '',
        material: '',
        specifications: {},
        additionalAttributes: {},
        isFeatured: false,
        shippingInfo: {
          weight: 0,
          dimensions: {
            length: null,
            width: null,
            height: null
          },
          freeShipping: false
        },
        seoMeta: {
          title: '',
          description: '',
          keywords: []
        },
        slug: '',
        brand: ''
      },
      $unset: {
        varientId: 1,
        attributes: 1,
        weight: 1,
        dimensions: 1,
        warranty: 1,
        isDefault: 1,
        vehicleCompatibility: 1
      }
    }, { new: true });
    
    if (result) {
      console.log('Variant updated successfully!');
      console.log('New structure:');
      console.log('- isVariant:', result.isVariant);
      console.log('- variant:', result.variant);
      console.log('- Name:', result.name);
    } else {
      console.log('Variant not found');
    }
    
    // Clear the variants array from parent product
    await Product.findByIdAndUpdate(parentId, {
      $unset: {
        variants: 1
      }
    });
    
    console.log('Cleared variants array from parent product');
    
    // Test the API
    console.log('\nTesting API...');
    const parentProduct = await Product.findById(parentId);
    if (parentProduct) {
      console.log('Parent product found:', parentProduct.name);
      
      // Find variants for this parent
      const variants = await Product.find({ 
        isVariant: true, 
        variant: parentId 
      });
      
      console.log(`Found ${variants.length} variants for parent product`);
      variants.forEach(v => console.log(`- ${v.name} (${v._id})`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run fix
const runFix = async () => {
  await connectDB();
  await fixVariant();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

runFix();




