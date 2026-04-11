import express from 'express';
import WishlistController from '../../modules/wishlist/controllers/wishlist.controller.js';
import {
    authenticateToken,
    optionalAuthenticateToken,
    resolveUserOrGuest
} from '../middlewares/auth.middleware.js';

const router = express.Router();
const wishlistController = new WishlistController();

// Internal / cron: notification lists — JWT required (not guest)
router.get(
    '/admin/stock-notifications',
    authenticateToken,
    wishlistController.getItemsForStockNotification
);
router.get(
    '/admin/price-drop-notifications',
    authenticateToken,
    wishlistController.getItemsForPriceDropNotification
);

// Logged-in user OR X-Guest-Id
router.use(optionalAuthenticateToken);
router.use(resolveUserOrGuest);

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

export default router;
