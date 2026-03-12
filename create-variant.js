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

// Create the variant with correct structure
const createVariant = async () => {
  try {
    console.log('Creating variant with correct structure...');
    
    const parentId = '68a9f606e8fd683cd4ff3d47';
    
    // Create new variant product with correct structure
    const variantData = {
      name: 'Black Color Variant',
      description: 'Alpha Front Grill in Black color for Tata Nexon',
      shortDescription: '',
      pricing: {
        originalPrice: 2800,
        salePrice: 1200,
        currency: 'INR'
      },
      images: {
        primary: 'https://cloudinary.com/black-grill.jpg',
        gallery: [
          'https://cloudinary.com/black-grill-2.jpg'
        ]
      },
      categoryId: '68a9e25a7e2f920b843a3042', // Same as parent product
      compatibility: {
        type: 'universal',
        specificVariants: [],
        compatibleModels: [],
        compatibleMakes: [],
        notes: 'Black variant for Tata Nexon 2017-2019'
      },
      features: [],
      partType: 'Aftermarket',
      fitmentType: '',
      material: '',
      specifications: {},
      additionalAttributes: {
        color: 'Black',
        finish: 'Matte',
        material: 'ABS Plastic'
      },
      inventory: {
        stock: 15,
        lowStockThreshold: 5,
        trackInventory: true
      },
      isActive: true,
      isFeatured: false,
      shippingInfo: {
        weight: 0.8,
        dimensions: {
          length: 45,
          width: 25,
          height: 5
        },
        freeShipping: false
      },
      returnPolicy: {
        returnable: true,
        returnDays: 7
      },
      seoMeta: {
        title: '',
        description: '',
        keywords: []
      },
      views: 0,
      salesCount: 0,
      sku: 'JG-VAR-3D47-503121-NUM',
      slug: '',
      brand: '',
      // New variant fields
      isVariant: true,
      variant: parentId,
      createdAt: new Date('2025-09-28T01:21:43.133Z'),
      updatedAt: new Date('2025-09-28T01:21:43.133Z')
    };
    
    // Create the variant as a new Product document
    const newVariant = new Product(variantData);
    await newVariant.save();
    
    console.log(`Created new variant product: ${newVariant.name} (${newVariant._id})`);
    
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

// Run create
const runCreate = async () => {
  await connectDB();
  await createVariant();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

runCreate();
