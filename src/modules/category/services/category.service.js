import CategoryRepository from "../repositories/category.repositoy.js";
import { CategoryEntity } from "../entity/category.entity.js";
import { uploadService } from "../../upload/services/upload.service.js";

class CategoryService {
    constructor() {
        this.categoryRepository = new CategoryRepository();
    }

    async createCategory(categoryData) {
        try {
            // Basic validation
            if (!categoryData.name || !categoryData.slug) {
                throw new Error('Name and slug are required');
            }

            // Handle parentCategory - if empty string, set to null
            if (categoryData.parentCategory === '' || categoryData.parentCategory === undefined) {
                categoryData.parentCategory = null;
            }

            const category = await this.categoryRepository.create(categoryData);
            const categoryEntity = CategoryEntity.fromModel(category);
            
            return {
                success: true,
                data: categoryEntity.toJSON(),
                message: 'Category created successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getCategoryById(id) {
        try {
            const category = await this.categoryRepository.findById(id);
            
            if (!category) {
                throw new Error('Category not found');
            }

            const categoryEntity = CategoryEntity.fromModel(category);
            return {
                success: true,
                data: categoryEntity.toJSON(),
                message: 'Category retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getCategoryBySlug(slug) {
        try {
            const category = await this.categoryRepository.findBySlug(slug);
            
            if (!category) {
                throw new Error('Category not found');
            }

            const categoryEntity = CategoryEntity.fromModel(category);
            return {
                success: true,
                data: categoryEntity.toJSON(),
                message: 'Category retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllCategories(filters = {}) {
        try {
            console.log('🔍 getAllCategories service called');
            console.log('🔍 Filters:', filters);
            
            const categories = await this.categoryRepository.findAll(filters);
            console.log('🔍 Repository result:', categories);
            console.log('🔍 Categories from DB:', categories?.length);
            
            const categoryEntities = CategoryEntity.fromModelList(categories);
            console.log('🔍 Category entities:', categoryEntities);
            console.log('🔍 Entities length:', categoryEntities?.length);
            
            const jsonData = categoryEntities.map(entity => entity.toJSON());
            console.log('🔍 JSON data:', jsonData);
            console.log('🔍 JSON data length:', jsonData?.length);
            
            const result = {
                success: true,
                data: jsonData,
                message: 'Categories retrieved successfully',
                count: categoryEntities.length
            };
            
            console.log('🔍 Final service result:', result);
            return result;
        } catch (error) {
            console.error('❌ getAllCategories service error:', error);
            throw error;
        }
    }

    async getCategoriesWithPagination(filters = {}, options = {}) {
        try {
            const result = await this.categoryRepository.findWithPagination(filters, options);
            const categoryEntities = CategoryEntity.fromModelList(result.data);
            
            return {
                success: true,
                data: categoryEntities.map(entity => entity.toJSON()),
                pagination: result.pagination,
                message: 'Categories retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async updateCategory(id, updateData) {
        try {
            const existingCategory = await this.categoryRepository.findById(id);
            
            if (!existingCategory) {
                throw new Error('Category not found');
            }

            // Handle parentCategory - if empty string, set to null
            if (updateData.parentCategory === '' || updateData.parentCategory === undefined) {
                updateData.parentCategory = null;
            }

            // If new image is provided, delete old image from Cloudinary
            if (updateData.image && existingCategory.image) {
                try {
                    await uploadService.deleteFromCloudinaryByUrl(existingCategory.image);
                } catch (error) {
                    console.error('Error deleting old image:', error);
                    // Continue with update even if deletion fails
                }
            }

            const category = await this.categoryRepository.updateById(id, updateData);
            const categoryEntity = CategoryEntity.fromModel(category);
            
            return {
                success: true,
                data: categoryEntity.toJSON(),
                message: 'Category updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            const existingCategory = await this.categoryRepository.findById(id);
            
            if (!existingCategory) {
                throw new Error('Category not found');
            }

            // Check for child categories
            const hasChildren = await this.categoryRepository.hasChildren(id);
            if (hasChildren) {
                throw new Error('Cannot delete category with child categories. Remove child categories first.');
            }

            // Delete image from Cloudinary before deleting the record
            if (existingCategory.image) {
                try {
                    await uploadService.deleteFromCloudinaryByUrl(existingCategory.image);
                } catch (error) {
                    console.error('Error deleting image from Cloudinary:', error);
                    // Continue with deletion even if image deletion fails
                }
            }

            const category = await this.categoryRepository.deleteById(id);
            const categoryEntity = CategoryEntity.fromModel(category);
            
            return {
                success: true,
                data: categoryEntity.toJSON(),
                message: 'Category deleted successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getCategoryHierarchy() {
        try {
            const hierarchy = await this.categoryRepository.getHierarchy();
            
            return {
                success: true,
                data: hierarchy,
                message: 'Category hierarchy retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async searchCategories(searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                throw new Error('Search term is required');
            }

            const categories = await this.categoryRepository.searchCategories(searchTerm.trim());
            const categoryEntities = CategoryEntity.fromModelList(categories);
            
            return {
                success: true,
                data: categoryEntities.map(entity => entity.toJSON()),
                message: 'Category search completed successfully',
                count: categoryEntities.length
            };
        } catch (error) {
            throw error;
        }
    }
}

export default CategoryService;