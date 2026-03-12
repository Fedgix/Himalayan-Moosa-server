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
        console.log('🔍 getAllCategories called');
        console.log('🔍 Request query:', req.query);
        
        const filters = req.query;
        console.log('🔍 Filters:', filters);
        
        const result = await this.categoryService.getAllCategories(filters);
        console.log('🔍 Service result:', result);
        console.log('🔍 Categories count:', result.count);
        console.log('🔍 Categories data length:', result.data?.length);
        
        console.log('🔍 Final response data:', result.data);
        console.log('🔍 Response data type:', typeof result.data);
        console.log('🔍 Is array:', Array.isArray(result.data));
        
        return sendSuccess(res, result.message, result.data, 200);
    });

    getCategoriesWithPagination = catchAsync(async (req, res) => {
        const filters = req.query;
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
        };
        const result = await this.categoryService.getCategoriesWithPagination(filters, options);
        return sendSuccess(res, result.message, result.data, 200);
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