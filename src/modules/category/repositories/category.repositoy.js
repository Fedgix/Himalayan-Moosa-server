import Category from "../models/category.model.js";

class CategoryRepository {
    /**
     * Shared MongoDB query for public list + pagination (excludes page/limit/sort from filters).
     */
    _buildFilterQuery(filters = {}) {
        const includeInactive = filters.includeInactive === true || filters.includeInactive === 'true';
        const query = includeInactive ? {} : { isActive: true };

        if (filters.name) {
            query.name = { $regex: filters.name, $options: 'i' };
        }

        if (filters.slug) {
            query.slug = filters.slug;
        }

        if (filters.parentCategory !== undefined) {
            query.parentCategory = filters.parentCategory;
        }

        if (filters.level !== undefined) {
            query.level = filters.level;
        }

        return query;
    }

    async create(categoryData) {
        try {
            const newCategory = new Category(categoryData);
            const savedCategory = await newCategory.save();
            return savedCategory;
        } catch (error) {
            throw error;
        }
    }

    async findById(id) {
        try {
            const category = await Category.findById(id)
                .populate('parent')
                .populate('subcategories')
                .populate('products');
            return category;
        } catch (error) {
            throw error;
        }
    }

    async findBySlug(slug) {
        try {
            const category = await Category.findOne({ slug, isActive: true })
                .populate('parent')
                .populate('subcategories')
                .populate('products');
            return category;
        } catch (error) {
            throw error;
        }
    }

    async findAll(filters = {}) {
        try {
            console.log('🔍 findAll repository called');
            console.log('🔍 Filters:', filters);

            const query = this._buildFilterQuery(filters);
            console.log('🔍 Final query:', query);

            const categories = await Category.find(query)
                .populate('parent')
                .populate('subcategories')
                .populate('products')
                .sort({ displayOrder: 1, name: 1 });
            
            console.log('🔍 DB query result:', categories);
            console.log('🔍 Categories count from DB:', categories?.length);
            console.log('🔍 First category:', categories?.[0]);
            
            return categories;
        } catch (error) {
            console.error('❌ findAll repository error:', error);
            throw error;
        }
    }

    async findWithPagination(filters = {}, options = {}) {
        try {
            const filter = this._buildFilterQuery(filters);
            const { page = 1, limit = 10, sort = { displayOrder: 1, name: 1 } } = options;
            const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
            const safePage = Math.max(1, Number(page) || 1);
            const skip = (safePage - 1) * safeLimit;

            const [data, total] = await Promise.all([
                Category.find(filter)
                    .populate('parent')
                    .populate('subcategories')
                    .populate('products')
                    .sort(sort)
                    .skip(skip)
                    .limit(safeLimit),
                Category.countDocuments(filter)
            ]);

            return {
                data,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    pages: safeLimit ? Math.ceil(total / safeLimit) : 0
                }
            };
        } catch (error) {
            throw error;
        }
    }

    async updateById(id, updateData) {
        try {
            const category = await Category.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('parent').populate('subcategories').populate('products');
            
            return category;
        } catch (error) {
            throw error;
        }
    }

    async deleteById(id) {
        try {
            const category = await Category.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );
            
            return category;
        } catch (error) {
            throw error;
        }
    }

    async getHierarchy() {
        try {
            const hierarchy = await Category.aggregate([
                { $match: { isActive: true } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: 'parentCategory',
                        as: 'subcategories'
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: 'categoryId',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        name: 1,
                        slug: 1,
                        description: 1,
                        image: 1,
                        icon: 1,
                        level: 1,
                        displayOrder: 1,
                        subcategories: {
                            $map: {
                                input: '$subcategories',
                                as: 'sub',
                                in: {
                                    id: '$$sub._id',
                                    name: '$$sub.name',
                                    slug: '$$sub.slug',
                                    description: '$$sub.description',
                                    image: '$$sub.image',
                                    icon: '$$sub.icon',
                                    level: '$$sub.level',
                                    displayOrder: '$$sub.displayOrder',
                                    productCount: { $size: '$$sub.products' }
                                }
                            }
                        },
                        productCount: { $size: '$products' }
                    }
                },
                { $sort: { displayOrder: 1, name: 1 } }
            ]);
            
            return hierarchy;
        } catch (error) {
            throw error;
        }
    }

    async searchCategories(searchTerm) {
        try {
            const categories = await Category.find({
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { name: { $regex: searchTerm, $options: 'i' } },
                            { description: { $regex: searchTerm, $options: 'i' } }
                        ]
                    }
                ]
            }).populate('parent').populate('subcategories').populate('products');
            
            return categories;
        } catch (error) {
            throw error;
        }
    }

    async hasChildren(categoryId) {
        try {
            const childCount = await Category.countDocuments({ 
                parentCategory: categoryId, 
                isActive: true 
            });
            return childCount > 0;
        } catch (error) {
            throw error;
        }
    }

    async exists(categoryId) {
        try {
            const count = await Category.countDocuments({ 
                _id: categoryId, 
                isActive: true 
            });
            return count > 0;
        } catch (error) {
            throw error;
        }
    }
}

export default CategoryRepository;