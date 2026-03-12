import express from 'express';
import WishlistController from '../../modules/wishlist/controllers/wishlist.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();
const wishlistController = new WishlistController();

// All routes require authentication
router.use(authenticateToken);

// User wishlist routes
router.post('/', wishlistController.addToWishlist);
router.get('/', wishlistController.getWishlist);
router.get('/stats', wishlistController.getWishlistStats);
router.get('/count', wishlistController.getWishlistCount);
router.get('/search', wishlistController.searchWishlist);
router.get('/vehicle/:vehicleId', wishlistController.getWishlistByVehicle);
router.get('/priority/:priority', wishlistController.getWishlistByPriority);
router.get('/check/:productId', wishlistController.checkIfInWishlist);
router.get('/item/:id', wishlistController.getWishlistItem);
router.put('/item/:id', wishlistController.updateWishlistItem);
router.delete('/item/:id', wishlistController.deleteWishlistItem);
router.delete('/product/:productId', wishlistController.removeFromWishlist);
router.delete('/clear', wishlistController.clearWishlist);
router.post('/move-to-cart/:productId', wishlistController.moveToCart);

// Admin routes (for notifications)
router.get('/admin/stock-notifications', wishlistController.getItemsForStockNotification);
router.get('/admin/price-drop-notifications', wishlistController.getItemsForPriceDropNotification);

export default router; 