import { oauthStateRepository } from '../repositories/oauth.state.repository.js';
import CustomError from '../../../utils/custom.error.js';
import crypto from 'crypto';

export const oauthStateService = {
    async createState(endpoint = '', ttlMinutes = 5) {
        // Generate cryptographically secure state and nonce
        const state = crypto.randomBytes(32).toString('hex');
        const nonce = crypto.randomBytes(16).toString('hex');
        
        // Calculate expiration time
        const expiresAt = new Date(Date.now() + (ttlMinutes * 60 * 1000));
        
        const stateData = {
            state,
            nonce,
            endpoint,
            expiresAt
        };

        try {
            await oauthStateRepository.createState(stateData);
            return { state, nonce };
        } catch (error) {
            throw new CustomError('Failed to create OAuth state', 500, true, error.message);
        }
    },

    async validateAndGetState(state) {
        if (!state) {
            throw new CustomError('State parameter is required', 400);
        }

        try {
            const storedState = await oauthStateRepository.findByState(state);
            
            if (!storedState) {
                throw new CustomError('Invalid or expired state', 401);
            }

            // Double-check expiration (though MongoDB TTL should handle this)
            if (storedState.expiresAt <= new Date()) {
                await oauthStateRepository.deleteState(state);
                throw new CustomError('State has expired', 401);
            }

            return {
                nonce: storedState.nonce,
                endpoint: storedState.endpoint,
                createdAt: storedState.createdAt
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to validate OAuth state', 500, true, error.message);
        }
    },

    async consumeState(state) {
        const stateData = await this.validateAndGetState(state);
        
        try {
            await oauthStateRepository.deleteState(state);
            return stateData;
        } catch (error) {
            throw new CustomError('Failed to consume OAuth state', 500, true, error.message);
        }
    },

    async cleanupExpiredStates() {
        try {
            const deletedCount = await oauthStateRepository.cleanupExpiredStates();
            return { cleanedUp: deletedCount };
        } catch (error) {
            throw new CustomError('Failed to cleanup expired states', 500, true, error.message);
        }
    },

    async getStateStats() {
        try {
            return await oauthStateRepository.getStats();
        } catch (error) {
            throw new CustomError('Failed to get OAuth state statistics', 500, true, error.message);
        }
    }
};