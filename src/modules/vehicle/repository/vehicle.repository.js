import VehicleMake from '../models/vehicle-make.model.js';
import VehicleModel from '../models/vehicle-model.model.js';
import VehicleVariant from '../models/vehicle-variant.model.js';

class VehicleRepository {
    // Vehicle Make operations
    async createMake(makeData) {
        try {
            const make = new VehicleMake(makeData);
            const savedMake = await make.save();
            return savedMake;
        } catch (error) {
            throw error;
        }
    }

    async findMakeById(id) {
        try {
            const make = await VehicleMake.findById(id);
            return make;
        } catch (error) {
            throw error;
        }
    }

    async findAllMakes(filters = {}) {
        try {
            const query = { isActive: true };
            
            if (filters.name) {
                query.name = { $regex: filters.name, $options: 'i' };
            }
            
            if (filters.slug) {
                query.slug = filters.slug;
            }

            const makes = await VehicleMake.find(query)
                .populate('models')
                .sort({ displayOrder: 1, name: 1 });
            
            return makes;
        } catch (error) {
            throw error;
        }
    }

    async findMakeBySlug(slug) {
        try {
            const make = await VehicleMake.findOne({ 
                slug,
                isActive: true 
            }).populate('models');
            
            return make;
        } catch (error) {
            throw error;
        }
    }

    async findMakeByName(name) {
        try {
            const make = await VehicleMake.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                isActive: true 
            });
            
            return make;
        } catch (error) {
            throw error;
        }
    }

    async updateMake(id, updateData) {
        try {
            const make = await VehicleMake.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            
            return make;
        } catch (error) {
            throw error;
        }
    }

    async deleteMake(id) {
        try {
            const make = await VehicleMake.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );
            
            return make;
        } catch (error) {
            throw error;
        }
    }

    // Vehicle Model operations
    async createModel(modelData) {
        try {
            const model = new VehicleModel(modelData);
            const savedModel = await model.save();
            return savedModel;
        } catch (error) {
            throw error;
        }
    }

    async findModelById(id) {
        try {
            const model = await VehicleModel.findById(id);
            return model;
        } catch (error) {
            throw error;
        }
    }

    async findAllModels(filters = {}) {
        try {
            const query = { isActive: true };
            
            if (filters.makeId) {
                query.makeId = filters.makeId;
            }
            
            if (filters.name) {
                query.name = { $regex: filters.name, $options: 'i' };
            }
            
            if (filters.slug) {
                query.slug = filters.slug;
            }

            const models = await VehicleModel.find(query)
                .populate('make')
                .populate('variants')
                .sort({ displayOrder: 1, name: 1 });
            
            return models;
        } catch (error) {
            throw error;
        }
    }

    async findModelBySlug(makeId, slug) {
        try {
            const model = await VehicleModel.findOne({ 
                makeId,
                slug,
                isActive: true 
            }).populate('make').populate('variants');
            
            return model;
        } catch (error) {
            throw error;
        }
    }

    async updateModel(id, updateData) {
        try {
            const model = await VehicleModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            
            return model;
        } catch (error) {
            throw error;
        }
    }

    async deleteModel(id) {
        try {
            const model = await VehicleModel.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );
            
            return model;
        } catch (error) {
            throw error;
        }
    }

    // Vehicle Variant operations
    async createVariant(variantData) {
        try {
            const variant = new VehicleVariant(variantData);
            const savedVariant = await variant.save();
            return savedVariant;
        } catch (error) {
            throw error;
        }
    }

    async findVariantById(id) {
        try {
            const variant = await VehicleVariant.findById(id)
                .populate('model')
                .populate('make');
            return variant;
        } catch (error) {
            throw error;
        }
    }

    async findAllVariants(filters = {}) {
        try {
            const query = { isActive: true };
            
            if (filters.modelId) {
                query.modelId = filters.modelId;
            }
            
            if (filters.name) {
                query.name = { $regex: filters.name, $options: 'i' };
            }
            
            if (filters.slug) {
                query.slug = filters.slug;
            }
            
            if (filters.fuelType) {
                query.fuelType = filters.fuelType;
            }
            
            if (filters.transmission) {
                query.transmission = filters.transmission;
            }
            
            if (filters.startYear) {
                query['yearRange.startYear'] = { $lte: filters.startYear };
            }
            
            if (filters.endYear) {
                query['yearRange.endYear'] = { $gte: filters.endYear };
            }

            const variants = await VehicleVariant.find(query)
                .populate('model')
                .populate('make')
                .sort({ 'yearRange.startYear': -1, name: 1 });
            
            return variants;
        } catch (error) {
            throw error;
        }
    }

    async findVariantBySlug(modelId, slug) {
        try {
            const variant = await VehicleVariant.findOne({ 
                modelId,
                slug,
                isActive: true 
            }).populate('model').populate('make');
            
            return variant;
        } catch (error) {
            throw error;
        }
    }

    async updateVariant(id, updateData) {
        try {
            const variant = await VehicleVariant.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('model').populate('make');
            
            return variant;
        } catch (error) {
            throw error;
        }
    }

    async deleteVariant(id) {
        try {
            const variant = await VehicleVariant.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            );
            
            return variant;
        } catch (error) {
            throw error;
        }
    }

    // Hierarchy operations
    async getVehicleHierarchy() {
        try {
            const hierarchy = await VehicleMake.aggregate([
                { $match: { isActive: true } },
                {
                    $lookup: {
                        from: 'vehiclemodels',
                        localField: '_id',
                        foreignField: 'makeId',
                        as: 'models'
                    }
                },
                {
                    $lookup: {
                        from: 'vehiclevariants',
                        localField: 'models._id',
                        foreignField: 'modelId',
                        as: 'variants'
                    }
                },
                {
                    $project: {
                        name: 1,
                        slug: 1,
                        logo: 1,
                        models: {
                            $map: {
                                input: '$models',
                                as: 'model',
                                in: {
                                    id: '$$model._id',
                                    name: '$$model.name',
                                    slug: '$$model.slug',
                                    bannerImage: '$$model.bannerImage',
                                    variants: {
                                        $filter: {
                                            input: '$variants',
                                            as: 'variant',
                                            cond: { $eq: ['$$variant.modelId', '$$model._id'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                { $sort: { displayOrder: 1, name: 1 } }
            ]);
            
            return hierarchy;
        } catch (error) {
            throw error;
        }
    }

    async searchVehicles(searchTerm) {
        try {
            // Search in makes
            const makes = await VehicleMake.find({
                $and: [
                    { isActive: true },
                    { name: { $regex: searchTerm, $options: 'i' } }
                ]
            }).populate('models');

            // Search in models
            const models = await VehicleModel.find({
                $and: [
                    { isActive: true },
                    { name: { $regex: searchTerm, $options: 'i' } }
                ]
            }).populate('make').populate('variants');

            // Search in variants
            const variants = await VehicleVariant.find({
                $and: [
                    { isActive: true },
                    { name: { $regex: searchTerm, $options: 'i' } }
                ]
            }).populate('model').populate('make');

            return {
                makes,
                models,
                variants
            };
        } catch (error) {
            throw error;
        }
    }

    // Get complete vehicle info by variant ID
    async getCompleteVehicleInfo(variantId) {
        try {
            const variant = await VehicleVariant.findById(variantId)
                .populate('model')
                .populate('make');
            
            if (!variant) return null;

            return {
                id: variant._id,
                make: variant.make,
                model: variant.model,
                variant: variant,
                fullName: variant.fullName,
                images: variant.model?.images || []
            };
        } catch (error) {
            throw error;
        }
    }

    // Compatibility search methods
    async findCompatibleVariants(filters = {}) {
        try {
            const query = { isActive: true };
            
            if (filters.makeId) {
                query['model.makeId'] = filters.makeId;
            }
            
            if (filters.modelId) {
                query.modelId = filters.modelId;
            }
            
            if (filters.year) {
                query['yearRange.startYear'] = { $lte: filters.year };
                query['yearRange.endYear'] = { $gte: filters.year };
            }
            
            if (filters.fuelType) {
                query.fuelType = filters.fuelType;
            }
            
            if (filters.transmission) {
                query.transmission = filters.transmission;
            }

            const variants = await VehicleVariant.find(query)
                .populate('model')
                .populate('make')
                .sort({ 'yearRange.startYear': -1, name: 1 });
            
            return variants;
        } catch (error) {
            throw error;
        }
    }
}

export default VehicleRepository; 