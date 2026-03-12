import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    subscribed: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const SubscriptionModel = mongoose.model('Subscription', SubscriptionSchema);

export default SubscriptionModel; 