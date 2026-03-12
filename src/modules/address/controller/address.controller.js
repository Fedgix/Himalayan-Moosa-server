import { addressService } from '../service/address.service.js';
import { sendSuccess } from '../../../utils/response.handler.js';
import CustomError from '../../../utils/custom.error.js';
import mongoose from 'mongoose';

export const addressController = {
    createAddress: async (req, res) => {
        const userId = req.user.id;
        const addressData = req.body;
        console.log("_User id: ", userId, " _addressData: ", req.body)
        const address = await addressService.createAddress(userId, addressData);
        
        sendSuccess(res, 'Address created successfully', { address: address.toJSON() }, 201);
    },

    getUserAddresses: async (req, res) => {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const options = {
            limit: parseInt(limit),
            offset: offset
        };

        const addresses = await addressService.getUserAddresses(userId, options);
        
        sendSuccess(res, 'Addresses fetched successfully', {
            addresses: addresses.map(addr => addr.toJSON()),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: addresses.length
            }
        });
    },

    getAddressById: async (req, res) => {
        const userId = req.user.id;
        const { addressId } = req.params;

        if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
            throw new CustomError('Valid address ID is required', 400);
        }

        const address = await addressService.getAddressById(userId, addressId);
        
        sendSuccess(res, 'Address fetched successfully', { address: address.toJSON() });
    },

    updateAddress: async (req, res) => {
        const userId = req.user.id;
        const { addressId } = req.params;
        const updateData = req.body;

        if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
            throw new CustomError('Valid address ID is required', 400);
        }

        const address = await addressService.updateAddress(userId, addressId, updateData);
        
        sendSuccess(res, 'Address updated successfully', { address: address.toJSON() });
    },

    deleteAddress: async (req, res) => {
        const userId = req.user.id;
        const { addressId } = req.params;

        if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
            throw new CustomError('Valid address ID is required', 400);
        }

        await addressService.deleteAddress(userId, addressId);
        
        sendSuccess(res, 'Address deleted successfully', {}, 200);
    },

    setDefaultAddress: async (req, res) => {
        const userId = req.user.id;
        const { addressId } = req.params;

        if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
            throw new CustomError('Valid address ID is required', 400);
        }

        const address = await addressService.setDefaultAddress(userId, addressId);
        
        sendSuccess(res, 'Default address set successfully', { address: address.toJSON() });
    },

    getDefaultAddress: async (req, res) => {
        const userId = req.user.id;
        
        const address = await addressService.getDefaultAddress(userId);
        
        if (!address) {
            throw new CustomError('No default address found', 404);
        }
        
        sendSuccess(res, 'Default address fetched successfully', { address: address.toJSON() });
    }
};