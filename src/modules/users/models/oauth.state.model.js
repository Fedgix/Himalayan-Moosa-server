import mongoose from 'mongoose';

const oauthStateSchema = new mongoose.Schema({
    state: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    nonce: {
        type: String,
        required: true
    },
    endpoint: {
        type: String,
        default: ''
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
        expires: 0 
    }
}, {
    timestamps: true
});

// Create TTL index for automatic cleanup
oauthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OAuthState = mongoose.model('OAuthState', oauthStateSchema);
export default OAuthState;