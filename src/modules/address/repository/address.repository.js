import mongoose from 'mongoose';
import { AddressModel } from '../models/address.model.js';
import CustomError from '../../../utils/custom.error.js';

export const addressRepository = {
    async create(addressData) {
        try {
            const address = await AddressModel.create(addressData);
            return address.toJSON();
        } catch (error) {
            throw new CustomError('Failed to create address', 500, true, { dbError: error.message });
        }
    },

    async findById(id) {
        try {
            const address = await AddressModel.findById(id);
            return address ? address.toJSON() : null;
        } catch (error) {
            throw new CustomError('Failed to fetch address', 500, true, { dbError: error.message });
        }
    },

    async findByUserId(userId, options = {}) {
        try {
            const { limit, offset, orderBy = 'createdAt', orderDirection = 'desc' } = options;

            const query = AddressModel.find({ userId })
                .sort({ [orderBy]: orderDirection === 'asc' ? 1 : -1 });

            if (limit) query.limit(limit);
            if (offset) query.skip(offset);

            const addresses = await query.exec();
            return addresses.map(address => address.toJSON());
        } catch (error) {
            throw new CustomError('Failed to fetch user addresses', 500, true, { dbError: error.message });
        }
    },

    async findDefaultByUserId(userId) {
        try {
            const address = await AddressModel.findOne({ userId, isDefault: true });
            return address ? address.toJSON() : null;
        } catch (error) {
            throw new CustomError('Failed to fetch default address', 500, true, { dbError: error.message });
        }
    },

    async update(id, updateData) {
        try {
            const objectId = new mongoose.Types.ObjectId(id);
            const updatedAddress = await AddressModel.findByIdAndUpdate(objectId, updateData, { new: true });
            return updatedAddress ? updatedAddress.toJSON() : null;
        } catch (error) {
            throw new CustomError('Failed to update address', 500, true, { dbError: error.message });
        }
    },

    async delete(id) {
        try {
            const result = await AddressModel.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            throw new CustomError('Failed to delete address', 500, true, { dbError: error.message });
        }
    },

    async countByUserId(userId) {
        try {
          const count = await AddressModel.countDocuments({ userId });
          return count;
        } catch (error) {
          throw new CustomError('Failed to count user addresses', 500, true, { dbError: error.message });
        }
    },      

    async clearDefaultForUser(userId) {
        try {
            await AddressModel.updateMany({ userId, isDefault: true }, { isDefault: false });
            return true;
        } catch (error) {
            throw new CustomError('Failed to clear default addresses', 500, true, { dbError: error.message });
        }
    },

    async findByUserIdAndId(userId, addressId) {
        try {
            const objectId = new mongoose.Types.ObjectId(addressId);
            const address = await AddressModel.findOne({ _id: objectId, userId });
            return address ? address.toJSON() : null;
        } catch (error) {
            throw new CustomError('Failed to fetch address', 500, true, { dbError: error.message });
        }
    }
};
