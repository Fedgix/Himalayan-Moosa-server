import OAuthState from '../models/oauth.state.model.js';
import CustomError from '../../../utils/custom.error.js';

export const oauthStateRepository = {
    async createState(stateData) {
        try {
            const oauthState = new OAuthState(stateData);
            const savedState = await oauthState.save();
            return savedState;
        } catch (error) {
            if (error.code === 11000) {
                throw new CustomError('State already exists', 409);
            }
            throw new CustomError('Database error while creating OAuth state', 500);
        }
    },

    async findByState(state) {
        try {
            const oauthState = await OAuthState.findOne({ 
                state,
                expiresAt: { $gt: new Date() } // Only return non-expired states
            });
            return oauthState;
        } catch (error) {
            throw new CustomError('Database error while finding OAuth state', 500);
        }
    },

    async deleteState(state) {
        try {
            const result = await OAuthState.deleteOne({ state });
            return result.deletedCount > 0;
        } catch (error) {
            throw new CustomError('Database error while deleting OAuth state', 500);
        }
    },

    async cleanupExpiredStates() {
        try {
            // MongoDB TTL handles this automatically, but we can manually clean up if needed
            const result = await OAuthState.deleteMany({ 
                expiresAt: { $lte: new Date() } 
            });
            return result.deletedCount;
        } catch (error) {
            throw new CustomError('Database error while cleaning up expired states', 500);
        }
    },

    async getStats() {
        try {
            const total = await OAuthState.countDocuments();
            const expired = await OAuthState.countDocuments({ 
                expiresAt: { $lte: new Date() } 
            });
            const active = total - expired;
            
            return { total, active, expired };
        } catch (error) {
            throw new CustomError('Database error while getting OAuth state stats', 500);
        }
    }
};