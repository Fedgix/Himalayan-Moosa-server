import CategoryService from "../services/category.service.js";
import catchAsync from "../../../frameworks/middlewares/catch.async.js";
import { sendSuccess } from "../../../utils/response.handler.js";

class CategoryController {
    constructor() {
        this.categoryService = new CategoryService();
    }

    createCategory = catchAsync(async (req, res) => {
        const result = await this.categoryService.createCategory(req.body);
        return sendSuccess(res, result.message, result.data, 201);
    });

    getCategoryById = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.categoryService.getCategoryById(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getCategoryBySlug = catchAsync(async (req, res) => {
        const { slug } = req.params;
        const result = await this.categoryService.getCategoryBySlug(slug);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getAllCategories = catchAsync(async (req, res) => {
        const { page, limit, ...filters } = req.query;
        const usePagination = page !== undefined || limit !== undefined;

        if (usePagination) {
            const options = {
                page: Math.max(1, parseInt(page, 10) || 1),
                limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
            };
            const result = await this.categoryService.getCategoriesWithPagination(filters, options);
            return sendSuccess(res, result.message, {
                items: result.data,
                pagination: result.pagination
            }, 200);
        }

        const result = await this.categoryService.getAllCategories(req.query);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getAllCategoriesForAdmin = catchAsync(async (req, res) => {
        const filters = req.query;
        const result = await this.categoryService.getAllCategoriesForAdmin(filters);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getCategoriesWithPagination = catchAsync(async (req, res) => {
        const { page, limit, ...filters } = req.query;
        const options = {
            page: Math.max(1, parseInt(page, 10) || 1),
            limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
        };
        const result = await this.categoryService.getCategoriesWithPagination(filters, options);
        return sendSuccess(res, result.message, {
            items: result.data,
            pagination: result.pagination
        }, 200);
    });

    updateCategory = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.categoryService.updateCategory(id, req.body);
        return sendSuccess(res, result.message, result.data, 200);
    });

    deleteCategory = catchAsync(async (req, res) => {
        const { id } = req.params;
        const result = await this.categoryService.deleteCategory(id);
        return sendSuccess(res, result.message, result.data, 200);
    });

    getCategoryHierarchy = catchAsync(async (req, res) => {
        const result = await this.categoryService.getCategoryHierarchy();
        return sendSuccess(res, result.message, result.data, 200);
    });

    searchCategories = catchAsync(async (req, res) => {
        const { q } = req.query;
        const result = await this.categoryService.searchCategories(q);
        return sendSuccess(res, result.message, { ...result.data, count: result.count }, 200);
    });
}

export default CategoryController;