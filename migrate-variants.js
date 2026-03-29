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

// Migration function
const migrateVariants = async () => {
  try {
    console.log('Starting variant migration...');
    
    // Get the productvariants collection
    const productVariantsCollection = mongoose.connection.db.collection('productvariants');
    const variants = await productVariantsCollection.find({}).toArray();
    
    console.log(`Found ${variants.length} variants in productvariants collection`);
    
    for (const variant of variants) {
      console.log(`Processing variant: ${variant.name} (${variant._id})`);
      
      // Check if this variant has a varientId (parent product ID)
      if (variant.varientId) {
        console.log(`Variant ${variant.name} has parent: ${variant.varientId}`);
        
        // Create new product document with variant structure
        const newVariantData = {
          name: variant.name,
          description: variant.description || '',
          shortDescription: '',
          pricing: variant.pricing || {
            originalPrice: 0,
            salePrice: null,
            currency: 'INR'
          },
          images: variant.images || {
            primary: null,
            gallery: []
          },
          categoryId: variant.categoryId || null,
          compatibility: {
            type: 'universal',
            specificVariants: [],
            compatibleModels: [],
            compatibleMakes: [],
            notes: variant.vehicleCompatibility?.notes || ''
          },
          features: [],
          partType: 'Aftermarket',
          fitmentType: '',
          material: '',
          specifications: {},
          additionalAttributes: variant.attributes || {},
          inventory: variant.inventory || {
            stock: 0,
            lowStockThreshold: 5,
            trackInventory: true
          },
          isActive: variant.isActive !== false,
          isFeatured: false,
          shippingInfo: {
            weight: variant.weight || 0,
            dimensions: variant.dimensions || {
              length: null,
              width: null,
              height: null
            },
            freeShipping: false
          },
          returnPolicy: variant.returnPolicy || {
            returnable: true,
            returnDays: 7
          },
          seoMeta: variant.seoMeta || {
            title: '',
            description: '',
            keywords: []
          },
          views: variant.views || 0,
          salesCount: variant.salesCount || 0,
          sku: variant.sku || '',
          slug: '',
          brand: '',
          // New variant fields
          isVariant: true,
          variant: variant.varientId.toString(),
          createdAt: variant.createdAt || new Date(),
          updatedAt: variant.updatedAt || new Date()
        };
        
        // Create the variant as a new Product document
        const newVariant = new Product(newVariantData);
        await newVariant.save();
        
        console.log(`Created new variant product: ${newVariant.name} (${newVariant._id})`);
        
        // Update parent product to remove old variants array
        await Product.findByIdAndUpdate(variant.varientId, {
          $unset: {
            variants: 1
          }
        });
        
        console.log(`Updated parent product ${variant.varientId}`);
      }
    }
    
    console.log('Migration completed successfully!');
    console.log('You can now drop the productvariants collection if needed.');
    
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateVariants();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

runMigration();