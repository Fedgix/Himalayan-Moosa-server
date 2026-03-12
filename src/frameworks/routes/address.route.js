import { Router } from 'express';
import { addressController } from '../../modules/address/controller/address.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import catchAsync from '../middlewares/catch.async.js';

const addressRouter = Router();

// Apply authentication middleware to all routes
addressRouter.use(authenticateToken);

// Create new address
addressRouter.post('/', catchAsync(addressController.createAddress));

// Get all addresses for user
addressRouter.get('/', catchAsync(addressController.getUserAddresses));

// Get default address
addressRouter.get('/default', catchAsync(addressController.getDefaultAddress));

// Get specific address by ID
addressRouter.get('/:addressId', catchAsync(addressController.getAddressById));

// Update specific address
addressRouter.put('/:addressId', catchAsync(addressController.updateAddress));

// Delete specific address
addressRouter.delete('/:addressId', catchAsync(addressController.deleteAddress));

// Set address as default
addressRouter.patch('/:addressId/default', catchAsync(addressController.setDefaultAddress));

export default addressRouter;