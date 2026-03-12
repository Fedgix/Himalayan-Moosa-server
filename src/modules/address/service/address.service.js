import { addressRepository } from '../repository/address.repository.js'
import { AddressEntity } from '../entity/address.entity.js';
import CustomError from '../../../utils/custom.error.js';

export const addressService = {
    async createAddress(userId, addressData) {
        // Create and validate address entity
        const addressEntity = new AddressEntity({
            ...addressData,
            userId
        });

        // Check if user has reached maximum address limit (e.g., 10)
        const addressCount = await addressRepository.countByUserId(userId);
        if (addressCount >= 10) {
            throw new CustomError('Maximum address limit reached (10 addresses allowed)', 400);
        }

        // If this is set as default, clear other default addresses
        if (addressEntity.isDefault) {
            await addressRepository.clearDefaultForUser(userId);
        }

        // If this is the first address, make it default
        if (addressCount === 0) {
            addressEntity.isDefault = true;
        }

        const dbData = addressEntity.toDatabase();
        const createdAddress = await addressRepository.create(dbData);
        
        return AddressEntity.fromDatabase(createdAddress);
    },

    async getUserAddresses(userId, options = {}) {
        const addresses = await addressRepository.findByUserId(userId, options);
        return addresses.map(address => AddressEntity.fromDatabase(address));
    },

    async getAddressById(userId, addressId) {
        const address = await addressRepository.findByUserIdAndId(userId, addressId);
        
        if (!address) {
            throw new CustomError('Address not found', 404);
        }

        return AddressEntity.fromDatabase(address);
    },

    async updateAddress(userId, addressId, updateData) {
        // Check if address exists and belongs to user
        const existingAddress = await addressRepository.findByUserIdAndId(userId, addressId);
        if (!existingAddress) {
            throw new CustomError('Address not found', 404);
        }

        // Create updated entity for validation
        const updatedEntity = new AddressEntity({
            ...existingAddress,
            ...updateData,
            id: addressId,
            userId
        });

        // If setting as default, clear other default addresses
        if (updatedEntity.isDefault && !existingAddress.isDefault) {
            await addressRepository.clearDefaultForUser(userId);
        }

        const dbData = updatedEntity.toDatabase();
        const updatedAddress = await addressRepository.update(addressId, dbData);
        
        if (!updatedAddress) {
            throw new CustomError('Failed to update address', 500);
        }

        return AddressEntity.fromDatabase(updatedAddress);
    },

    async deleteAddress(userId, addressId) {
        const existingAddress = await addressRepository.findByUserIdAndId(userId, addressId);
        if (!existingAddress) {
            throw new CustomError('Address not found', 404);
        }

        const deleted = await addressRepository.delete(addressId);
        if (!deleted) {
            throw new CustomError('Failed to delete address', 500);
        }

        // If deleted address was default, set another address as default
        if (existingAddress.isDefault) {
            const userAddresses = await addressRepository.findByUserId(userId, { limit: 1 });
            if (userAddresses.length > 0) {
                await addressRepository.update(userAddresses[0].id, { isDefault: true });
            }
        }

        return true;
    },

    async setDefaultAddress(userId, addressId) {
        const address = await addressRepository.findByUserIdAndId(userId, addressId);
        if (!address) {
            throw new CustomError('Address not found', 404);
        }

        if (address.isDefault) {
            throw new CustomError('Address is already set as default', 400);
        }

        // Clear current default and set new default
        await addressRepository.clearDefaultForUser(userId);
        const updatedAddress = await addressRepository.update(addressId, { isDefault: true });

        return AddressEntity.fromDatabase(updatedAddress);
    },

    async getDefaultAddress(userId) {
        const address = await addressRepository.findDefaultByUserId(userId);
        return address ? AddressEntity.fromDatabase(address) : null;
    }
};