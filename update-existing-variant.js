import mongoose from 'mongoose';

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

// Update the existing variant to new structure
const updateExistingVariant = async () => {
  try {
    console.log('Updating existing variant to new structure...');
    
    const variantId = new mongoose.Types.ObjectId('68d88da7c581f5ec2111a2d5');
    const parentId = '68a9f606e8fd683cd4ff3d47';
    
    // Get the products collection
    const productsCollection = mongoose.connection.db.collection('products');
    
    // Update the variant to new structure
    const updateResult = await productsCollection.updateOne(
      { _id: variantId },
      {
        $set: {
          // Add missing required fields
          shortDescription: '',
          categoryId: new mongoose.Types.ObjectId('68a9e25a7e2f920b843a3042'), // Same as parent
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
          seoMeta: {
            title: '',
            description: '',
            keywords: []
          },
          slug: '',
          brand: '',
          // New variant fields
          isVariant: true,
          variant: parentId
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
      }
    );
    
    console.log('Update result:', updateResult);
    
    if (updateResult.modifiedCount > 0) {
      console.log('Variant updated successfully!');
    } else {
      console.log('No changes made to variant');
    }
    
    // Clear the variants array from parent product
    const parentUpdateResult = await productsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(parentId) },
      {
        $unset: {
          variants: 1
        }
      }
    );
    
    console.log('Parent update result:', parentUpdateResult);
    console.log('Cleared variants array from parent product');
    
    // Test the API
    console.log('\nTesting API...');
    const parentProduct = await productsCollection.findOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (parentProduct) {
      console.log('Parent product found:', parentProduct.name);
      
      // Find variants for this parent
      const variants = await productsCollection.find({ 
        isVariant: true, 
        variant: parentId 
      }).toArray();
      
      console.log(`Found ${variants.length} variants for parent product`);
      variants.forEach(v => console.log(`- ${v.name} (${v._id})`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run update
const runUpdate = async () => {
  await connectDB();
  await updateExistingVariant();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

runUpdate();




