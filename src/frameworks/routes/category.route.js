import { Router } from "express";
import CategoryController from "../../modules/category/controllers/category.controller.js";

const router = Router();
const categoryController = new CategoryController();

// Category CRUD routes
router.post('/', categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/paginated', categoryController.getCategoriesWithPagination);
router.get('/hierarchy', categoryController.getCategoryHierarchy);
router.get('/search', categoryController.searchCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;