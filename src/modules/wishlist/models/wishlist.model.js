import mongoose, { Schema } from "mongoose";

const wishlistSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: [true, 'User ID is required'],
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: 'Please provide a valid user ID'
        }
    },
    productId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Product',
        required: [true, 'Product ID is required'],
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: 'Please provide a valid product ID'
        }
    },
    variantId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Product',
        required: false, // Optional - for products without variants
        validate: {
            validator: function(v) {
                return !v || mongoose.Types.ObjectId.isValid(v);
            },
            message: 'Please provide a valid variant ID'
        }
    },
    // Additional user notes
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    // Priority level for wishlist item
    priority: {
        type: String,
        enum: {
            values: ['Low', 'Medium', 'High', 'Urgent'],
            message: 'Priority must be one of: Low, Medium, High, Urgent'
        },
        default: 'Medium'
    },
    // Whether to notify when product comes back in stock
    notifyOnStock: {
        type: Boolean,
        default: true
    },
    // Whether to notify on price drop
    notifyOnPriceDrop: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index to ensure user can't have duplicate product-variant combination in wishlist
wishlistSchema.index({ userId: 1, productId: 1, variantId: 1 }, { unique: true });
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ productId: 1 });
wishlistSchema.index({ variantId: 1 });
wishlistSchema.index({ priority: 1 });
wishlistSchema.index({ notifyOnStock: 1 });
wishlistSchema.index({ notifyOnPriceDrop: 1 });
wishlistSchema.index({ createdAt: -1 });

// Virtual for product details
wishlistSchema.virtual('product', {
    ref: 'Product',
    localField: 'productId',
    foreignField: '_id',
    justOne: true
});

// Virtual for variant details
wishlistSchema.virtual('variant', {
    ref: 'Product',
    localField: 'variantId',
    foreignField: '_id',
    justOne: true
});


// Virtual for user details
wishlistSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist; 