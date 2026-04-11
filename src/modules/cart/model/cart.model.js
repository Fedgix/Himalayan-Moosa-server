import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema({
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
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
        default: undefined,
        validate: {
            validator: function (v) {
                return v == null || mongoose.Types.ObjectId.isValid(v);
            },
            message: "Please provide a valid user ID",
        },
    },
    guestId: {
        type: String,
        trim: true,
        maxlength: 128,
        default: undefined,
    },
    quantity: { 
        type: Number, 
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        max: [100, 'Quantity cannot exceed 100'],
        validate: {
            validator: function(v) {
                return Number.isInteger(v) && v > 0;
            },
            message: 'Quantity must be a positive integer'
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

cartSchema.pre("validate", function (next) {
    const hasUser = this.userId != null;
    const hasGuest = this.guestId != null && String(this.guestId).trim() !== "";
    if (!hasUser && !hasGuest) {
        this.invalidate("guestId", "Either a logged-in user or guest session (guestId) is required");
    }
    if (hasUser && hasGuest) {
        this.guestId = undefined;
    }
    next();
});

// One line per user per product/variant; one line per guest per product/variant
cartSchema.index(
    { userId: 1, productId: 1, variantId: 1 },
    {
        unique: true,
        partialFilterExpression: { userId: { $exists: true, $ne: null } },
    }
);
cartSchema.index(
    { guestId: 1, productId: 1, variantId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            guestId: { $exists: true, $type: "string", $ne: "" },
        },
    }
);
cartSchema.index({ userId: 1 });
cartSchema.index({ productId: 1 });
cartSchema.index({ variantId: 1 });

// Virtual for product details
cartSchema.virtual('product', {
    ref: 'Product',
    localField: 'productId',
    foreignField: '_id',
    justOne: true
});

// Virtual for variant details
cartSchema.virtual('variant', {
    ref: 'Product',
    localField: 'variantId',
    foreignField: '_id',
    justOne: true
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;