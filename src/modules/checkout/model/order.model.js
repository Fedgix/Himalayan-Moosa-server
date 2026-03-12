// order.model.js

import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: false // Optional for products without variants
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    productDescription: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true,
        default: ''
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        trim: true,
        default: 'Default'
    },
    colorCode: {
        type: String,
        trim: true
    },
    size: {
        type: String,
        trim: true,
        default: 'Standard'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPrice: {
        type: Number,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    itemTotal: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        trim: true,
        default: 'Unisex'
    },
    // Legacy vehicle fields (optional for backward compatibility)
    selectedVehicleId: {
        type: Schema.Types.ObjectId,
        ref: 'VehicleVariantYear',
        required: false
    },
    selectedVehicleDetails: {
        make: String,
        model: String,
        variant: String,
        year: Number
    },
    // Automobile specific fields
    warranty: {
        type: Number,
        min: 0,
        default: 0
    },
    installationDifficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Professional Only'],
        default: 'Medium'
    },
    fitmentType: {
        type: String,
        enum: ['Direct Fit', 'Universal', 'Custom Fit', 'Adapter Required'],
        default: 'Direct Fit'
    }
}, { _id: false });

const addressSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true
    },
    addressLine2: {
        type: String,
        trim: true
    },
    landmark: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pinCode: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        default: 'India',
        trim: true
    }
}, { _id: false });

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'Order must have at least one item'
        }
    },
    shippingAddress: {
        type: addressSchema,
        required: true
    },
    billingAddress: {
        type: addressSchema
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'],
        default: 'pending',
        index: true
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending',
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'cod', 'wallet'],
        default: 'razorpay'
    },
    razorpayOrderId: {
        type: String,
        trim: true,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        trim: true,
        index: true
    },
    razorpaySignature: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    cancelledAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    // Automobile specific fields
    installationRequired: {
        type: Boolean,
        default: false
    },
    installationAddress: {
        type: addressSchema
    },
    installationDate: {
        type: Date
    },
    vehicleDetails: {
        brand: String,
        model: String,
        year: String,
        registrationNumber: String
    },
    warrantyDetails: {
        type: Map,
        of: {
            productId: Schema.Types.ObjectId,
            warrantyPeriod: Number,
            warrantyStartDate: Date,
            warrantyEndDate: Date
        },
        default: {}
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ razorpayPaymentId: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ installationRequired: 1 });
orderSchema.index({ 'vehicleDetails.brand': 1, 'vehicleDetails.model': 1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)); // in days
});

// Virtual for installation status
orderSchema.virtual('installationStatus').get(function() {
    if (!this.installationRequired) return 'Not Required';
    if (!this.installationDate) return 'Pending';
    if (this.installationDate > new Date()) return 'Scheduled';
    return 'Completed';
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => {
        const price = item.discountPrice || item.price;
        item.itemTotal = price * item.quantity;
        return sum + item.itemTotal;
    }, 0);

    // Calculate total amount
    this.totalAmount = this.subtotal + this.shippingFee + this.tax - this.discount;

    next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;