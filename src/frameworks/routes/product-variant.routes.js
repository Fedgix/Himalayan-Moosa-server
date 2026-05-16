import { Router } from 'express';
import ProductController from '../../modules/product/controllers/product.controller.js';
import { authenticateAdmin } from '../../modules/admin/middlewares/admin.auth.middleware.js';

const router = Router();
const productController = new ProductController();

// Legacy alias routes for older admin frontend builds (product-variant → product variants)
router.use(authenticateAdmin);

router.get('/product/:productId/variants', productController.listProductVariants);
router.post('/product/:productId/variants', productController.createVariant);
router.put('/:variantId', productController.updateVariant);
router.delete('/:variantId', productController.deleteVariant);

export default router;
