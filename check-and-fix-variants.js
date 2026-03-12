import mongoose from 'mongoose';
import Product from './src/modules/product/models/product.model.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://janathagarage633:kuKPsaaE2YmZMa4o@janathagarage.nubic2v.mongodb.net');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check and fix variants
const checkAndFixVariants = async () => {
  try {
    console.log('Checking for variants that need migration...');
    
    // Find the specific variant by ID
    const variantId = '68d88da7c581f5ec2111a2d5';
    const variant = await Product.findById(variantId);
    
    if (variant) {
      console.log('Found variant:', variant.name);
      console.log('Current structure:');
      console.log('- Has varientId:', !!variant.varientId);
      console.log('- Has isVariant:', !!variant.isVariant);
      console.log('- Has variant field:', !!variant.variant);
      
      // If it has varientId but not the new structure, update it
      if (variant.varientId && !variant.isVariant) {
        console.log('Updating variant to new structure...');
        
        await Product.findByIdAndUpdate(variantId, {
          $set: {
            isVariant: true,
            variant: variant.varientId.toString()
          },
          $unset: {
            varientId: 1
          }
        });
        
        console.log('Variant updated successfully!');
      } else if (variant.isVariant) {
        console.log('Variant already has new structure');
      }
    } else {
      console.log('Variant not found in products collection');
      
      // Check if it's in productvariants collection
      const productVariantsCollection = mongoose.connection.db.collection('productvariants');
      const variantFromVariants = await productVariantsCollection.findOne({_id: new mongoose.Types.ObjectId(variantId)});
      
      if (variantFromVariants) {
        console.log('Found variant in productvariants collection:', variantFromVariants.name);
        console.log('Parent ID:', variantFromVariants.varientId);
        
        // Create new product with variant structure
        const newVariantData = {
          name: variantFromVariants.name,
          description: variantFromVariants.description || '',
          shortDescription: '',
          pricing: variantFromVariants.pricing || {
            originalPrice: 0,
            salePrice: null,
            currency: 'INR'
          },
          images: variantFromVariants.images || {
            primary: null,
            gallery: []
          },
          categoryId: variantFromVariants.categoryId || null,
          compatibility: {
            type: 'universal',
            specificVariants: [],
            compatibleModels: [],
            compatibleMakes: [],
            notes: variantFromVariants.vehicleCompatibility?.notes || ''
          },
          features: [],
          partType: 'Aftermarket',
          fitmentType: '',
          material: '',
          specifications: {},
          additionalAttributes: variantFromVariants.attributes || {},
          inventory: variantFromVariants.inventory || {
            stock: 0,
            lowStockThreshold: 5,
            trackInventory: true
          },
          isActive: variantFromVariants.isActive !== false,
          isFeatured: false,
          shippingInfo: {
            weight: variantFromVariants.weight || 0,
            dimensions: variantFromVariants.dimensions || {
              length: null,
              width: null,
              height: null
            },
            freeShipping: false
          },
          returnPolicy: variantFromVariants.returnPolicy || {
            returnable: true,
            returnDays: 7
          },
          seoMeta: variantFromVariants.seoMeta || {
            title: '',
            description: '',
            keywords: []
          },
          views: variantFromVariants.views || 0,
          salesCount: variantFromVariants.salesCount || 0,
          sku: variantFromVariants.sku || '',
          slug: '',
          brand: '',
          // New variant fields
          isVariant: true,
          variant: variantFromVariants.varientId.toString(),
          createdAt: variantFromVariants.createdAt || new Date(),
          updatedAt: variantFromVariants.updatedAt || new Date()
        };
        
        // Create the variant as a new Product document
        const newVariant = new Product(newVariantData);
        await newVariant.save();
        
        console.log(`Created new variant product: ${newVariant.name} (${newVariant._id})`);
      }
    }
    
    // Now test the API
    console.log('\nTesting API...');
    const parentProduct = await Product.findById('68a9f606e8fd683cd4ff3d47');
    if (parentProduct) {
      console.log('Parent product found:', parentProduct.name);
      
      // Find variants for this parent
      const variants = await Product.find({ 
        isVariant: true, 
        variant: '68a9f606e8fd683cd4ff3d47' 
      });
      
      console.log(`Found ${variants.length} variants for parent product`);
      variants.forEach(v => console.log(`- ${v.name} (${v._id})`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run check and fix
const runCheckAndFix = async () => {
  await connectDB();
  await checkAndFixVariants();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

runCheckAndFix();




