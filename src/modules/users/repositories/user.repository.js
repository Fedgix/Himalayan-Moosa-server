import User from '../models/user.model.js';
import { UserEntity } from '../entity/user.entity.js';
import CustomError from '../../../utils/custom.error.js';

export const userRepository = {
    async findByEmail(email) {
        try {
            const user = await User.findOne({ email, isActive: true });
            return user ? new UserEntity(user) : null;
        } catch (error) {
            throw new CustomError('Database error while finding user by email', 500);
        }
    },

    /** Returns raw mongoose document (includes password) for auth only. Do not expose to client. */
    async findByEmailForAuth(email) {
        try {
            return await User.findOne({ email, isActive: true });
        } catch (error) {
            throw new CustomError('Database error while finding user by email', 500);
        }
    },

    async findByGoogleId(googleId) {
        try {
            const user = await User.findOne({ googleId, isActive: true });
            return user ? new UserEntity(user) : null;
        } catch (error) {
            throw new CustomError('Database error while finding user by Google ID', 500);
        }
    },

    async findById(id) {
        try {
            const user = await User.findById(id);
            return user ? new UserEntity(user) : null;
        } catch (error) {
            throw new CustomError('Database error while finding user by ID', 500);
        }
    },

    async create(userData) {
        try {
            const user = new User(userData);
            const savedUser = await user.save();
            return new UserEntity(savedUser);
        } catch (error) {
            if (error.code === 11000) {
                throw new CustomError('User with this email already exists', 409);
            }
            throw new CustomError('Database error while creating user', 500);
        }
    },

    async update(id, updateData) {
        try {
            const user = await User.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            );
            return user ? new UserEntity(user) : null;
        } catch (error) {
            throw new CustomError('Database error while updating user', 500);
        }
    },

    async findOrCreateGoogleUser(profileData) {
        try {
            // First try to find by Google ID
            let user = await this.findByGoogleId(profileData.googleId);
            
            if (user) {
                return user;
            }

            // If not found by Google ID, try by email
            user = await this.findByEmail(profileData.email);
            
            if (user) {
                // Update existing user with Google ID
                return await this.update(user.id, { googleId: profileData.googleId });
            }

            // Create new user
            return await this.create(profileData);
        } catch (error) {
            throw new CustomError('Error in findOrCreateGoogleUser', 500, true, error.message);
        }
    }
};
