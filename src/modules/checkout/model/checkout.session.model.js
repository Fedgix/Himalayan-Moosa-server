import mongoose, { Schema } from "mongoose";

const checkoutSessionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One active session per user
    },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: false },
        productName: { type: String, required: true },
        color: { type: String, required: true },
        size: { type: String, required: true },
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        quantity: { type: Number, required: true },
        itemTotal: { type: Number, required: true },
        availableStock: { type: Number, required: true },
        image: { type: String },
        category: { type: String },
        gender: { type: String }
    }],
    source: {
        type: String,
        enum: ['cart', 'direct'],
        default: 'cart'
    },
    shippingAddress: {
        type: Schema.Types.Mixed,
        default: null
    },
    subtotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    razorpayOrderId: { type: String },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 1800 // 30 minutes TTL
    }
}, {
    timestamps: true
});

checkoutSessionSchema.index({ userId: 1 });
checkoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CheckoutSession = mongoose.model("CheckoutSession", checkoutSessionSchema);
export default CheckoutSession;
