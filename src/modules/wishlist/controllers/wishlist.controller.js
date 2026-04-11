import WishlistService from '../services/wishlist.service.js';
import catchAsync from '../../../frameworks/middlewares/catch.async.js';
import { sendSuccess } from '../../../utils/response.handler.js';

class WishlistController {
    constructor() {
        this.wishlistService = new WishlistService();
    }

    addToWishlist = catchAsync(async (req, res) => {
        const owner = req.owner;
        const result = await this.wishlistService.addToWishlist(owner, req.body);
        return sendSuccess(res, result.message, result.data, 201);
    });

    getWishlist = catchAsync(async (req, res) => {
        const filters = req.query;
        const owner = req.owner;
        const result = await this.wishlistService.getWishlistByOwner(owner, filters);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getWishlistItem = catchAsync(async (req, res) => {
        const { id } = req.params;
        const owner = req.owner;
        const result = await this.wishlistService.getWishlistItemById(id, owner);
        return sendSuccess(res, result.message, result.data, 200);
    });

    updateWishlistItem = catchAsync(async (req, res) => {
        const { id } = req.params;
        const owner = req.owner;
        const result = await this.wishlistService.updateWishlistItem(id, owner, req.body);
        return sendSuccess(res, result.message, result.data, 200);
    });

    removeFromWishlist = catchAsync(async (req, res) => {
        const { productId } = req.params;
        const owner = req.owner;
        const result = await this.wishlistService.removeFromWishlist(owner, productId);
        return sendSuccess(res, result.message, result.data, 200);
    });

    deleteWishlistItem = catchAsync(async (req, res) => {
        const { id } = req.params;
        const owner = req.owner;
        const result = await this.wishlistService.deleteWishlistItem(id, owner);
        return sendSuccess(res, result.message, result.data, 200);
    });

    clearWishlist = catchAsync(async (req, res) => {
        const owner = req.owner;
        const result = await this.wishlistService.clearWishlist(owner);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getWishlistStats = catchAsync(async (req, res) => {
        const owner = req.owner;
        const result = await this.wishlistService.getWishlistStats(owner);
        return sendSuccess(res, result.message, result.data, 200);
    });

    searchWishlist = catchAsync(async (req, res) => {
        const { q } = req.query;
        const owner = req.owner;
        const result = await this.wishlistService.searchWishlist(owner, q);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getWishlistByVehicle = catchAsync(async (req, res) => {
        const { vehicleId } = req.params;
        const owner = req.owner;
        const result = await this.wishlistService.getWishlistByVehicle(owner, vehicleId);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getWishlistByPriority = catchAsync(async (req, res) => {
        const { priority } = req.params;
        const owner = req.owner;
        const result = await this.wishlistService.getWishlistByPriority(owner, priority);
        return sendSuccess(res, result.message, result.data, 200);
    });

    checkIfInWishlist = catchAsync(async (req, res) => {
        const { productId } = req.params;
        const owner = req.owner;
        const result = await this.wishlistService.checkIfInWishlist(owner, productId);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getWishlistCount = catchAsync(async (req, res) => {
        const owner = req.owner;
        const result = await this.wishlistService.getWishlistCount(owner);
        return sendSuccess(res, result.message, result.data, 200);
    });

    moveToCart = catchAsync(async (req, res) => {
        const { productId } = req.params;
        const owner = req.owner;
        const result = await this.wishlistService.moveToCart(owner, productId);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getItemsForStockNotification = catchAsync(async (req, res) => {
        const result = await this.wishlistService.getItemsForStockNotification();
        return sendSuccess(res, result.message, result.data, 200);
    });

    getItemsForPriceDropNotification = catchAsync(async (req, res) => {
        const result = await this.wishlistService.getItemsForPriceDropNotification();
        return sendSuccess(res, result.message, result.data, 200);
    });
}

export default WishlistController;
