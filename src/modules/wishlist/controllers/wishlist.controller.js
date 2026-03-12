import WishlistService from '../services/wishlist.service.js';
import catchAsync from '../../../frameworks/middlewares/catch.async.js';
import { sendSuccess } from '../../../utils/response.handler.js';
import CustomError from '../../../utils/custom.error.js';

class WishlistController {
    constructor() {
        this.wishlistService = new WishlistService();
    }

    // Add product to wishlist
    addToWishlist = catchAsync(async (req, res) => {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        
        const wishlistData = {
            ...req.body,
            userId: userId.toString() // Convert ObjectId to string
        };
        const result = await this.wishlistService.addToWishlist(wishlistData);
        return sendSuccess(res, result.message, result.data, 201);
    });

    // Get user's wishlist
    getWishlist = catchAsync(async (req, res) => {
        const filters = req.query;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.getWishlistByUser(userId.toString(), filters);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Get specific wishlist item
    getWishlistItem = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.wishlistService.getWishlistItemById(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Update wishlist item
    updateWishlistItem = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.wishlistService.updateWishlistItem(id, req.body);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Remove product from wishlist
    removeFromWishlist = catchAsync(async (req, res) => {
        const { productId } = req.params;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.removeFromWishlist(userId.toString(), productId);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Delete wishlist item by ID
    deleteWishlistItem = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.wishlistService.deleteWishlistItem(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Clear entire wishlist
    clearWishlist = catchAsync(async (req, res) => {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.clearWishlist(userId.toString());
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Get wishlist statistics
    getWishlistStats = catchAsync(async (req, res) => {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.getWishlistStats(userId.toString());
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Search wishlist
    searchWishlist = catchAsync(async (req, res) => {
        const { q } = req.query;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.searchWishlist(userId.toString(), q);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Get wishlist by vehicle
    getWishlistByVehicle = catchAsync(async (req, res) => {
        const { vehicleId } = req.params;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.getWishlistByVehicle(userId.toString(), vehicleId);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Get wishlist by priority
    getWishlistByPriority = catchAsync(async (req, res) => {
        const { priority } = req.params;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.getWishlistByPriority(userId.toString(), priority);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Check if product is in wishlist
    checkIfInWishlist = catchAsync(async (req, res) => {
        const { productId } = req.params;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.checkIfInWishlist(userId.toString(), productId);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Get wishlist count
    getWishlistCount = catchAsync(async (req, res) => {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.getWishlistCount(userId.toString());
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Move item from wishlist to cart
    moveToCart = catchAsync(async (req, res) => {
        const { productId } = req.params;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            throw new CustomError('User ID not found in request', 400);
        }
        const result = await this.wishlistService.moveToCart(userId.toString(), productId);
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Admin: Get items for stock notification
    getItemsForStockNotification = catchAsync(async (req, res) => {
        const result = await this.wishlistService.getItemsForStockNotification();
        return sendSuccess(res, result.message, result.data, 200);
    });

    // Admin: Get items for price drop notification
    getItemsForPriceDropNotification = catchAsync(async (req, res) => {
        const result = await this.wishlistService.getItemsForPriceDropNotification();
        return sendSuccess(res, result.message, result.data, 200);
    });
}

export default WishlistController; 