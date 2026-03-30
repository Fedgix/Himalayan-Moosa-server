import { Router } from "express";
import AdminController from "../../modules/admin/controllers/admin.controller.js";
import AdminAuthController from "../../modules/admin/controllers/admin.auth.controller.js";
import ProductController from "../../modules/product/controllers/product.controller.js";
import CategoryController from "../../modules/category/controllers/category.controller.js";
import { authenticateAdmin, requireAdminRole } from "../../modules/admin/middlewares/admin.auth.middleware.js";
import catchAsync from "../middlewares/catch.async.js";

const router = Router();
const adminController = new AdminController();
const productController = new ProductController();
const categoryController = new CategoryController();

// Public admin routes (no authentication required)
router.post('/auth/login', catchAsync(AdminAuthController.login));
router.post('/auth/refresh-token', catchAsync(AdminAuthController.refreshToken));

// Protected admin routes (require authentication)
router.use(authenticateAdmin);

// Token verification
router.get('/auth/verify-token', catchAsync(AdminAuthController.verifyToken));

// Dashboard routes
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/activities', adminController.getDashboardActivities);

// Product management routes (admin only)
router.get('/products', productController.getAllProductsForAdmin);
router.get('/category', categoryController.getAllCategoriesForAdmin);
router.patch('/products/:id/activate', productController.activateProduct);
router.patch('/products/:id/deactivate', productController.deactivateProduct);

// Order management routes (admin only)
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

export default router; 