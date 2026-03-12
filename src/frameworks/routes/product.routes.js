import { Router } from 'express';
import ProductController from '../../modules/product/controllers/product.controller.js';
import { authenticateAdmin } from '../../modules/admin/middlewares/admin.auth.middleware.js';

const router = Router();
const productController = new ProductController();

// Public routes (no authentication required)
router.get('/all', productController.getAllProducts);
router.get('/paginated', productController.getProductsWithPagination);
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/all-new-arrivals', productController.getAllNewArrivals);
router.get('/best-sellers', productController.getBestSellers);
router.get('/compatible', productController.findCompatibleProducts);
router.get('/search', productController.searchProducts);
router.get('/by-category', productController.getProductsByCategory);
router.get('/by-vehicle', productController.getProductsByVehicle);
router.get('/by-brand', productController.getProductsByBrand);
router.get('/by-part-type', productController.getProductsByPartType);
router.get('/in-stock', productController.getProductsInStock);
router.get('/with-warranty', productController.getProductsWithWarranty);

// Unified product route (public) - supports query parameters
router.get('/', productController.getProduct);

// Product variants route (public) - removed - variants now handled in main product route
// router.get('/:id/variants', productController.getProductVariants);

// Legacy product detail routes (public) - kept for backward compatibility
router.get('/sku/:sku', productController.getProductBySku);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);

// Protected routes (admin authentication required)
router.use(authenticateAdmin);

// Product CRUD routes (admin only)
router.post('/', productController.createProduct);
router.post('/generate-slug-sku', productController.generateSlugAndSku);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Variant management routes (admin only)
router.post('/:productId/variants', productController.createVariant);
router.put('/variants/:variantId', productController.updateVariant);
router.delete('/variants/:variantId', productController.deleteVariant);

// Analytics routes
router.patch('/:id/stock', productController.updateStock);
router.patch('/:id/views', productController.incrementViews);
router.patch('/:id/sales', productController.incrementSalesCount);

export default router;