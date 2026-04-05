import VehicleRepository from '../repository/vehicle.repository.js';
import { uploadService } from '../../upload/services/upload.service.js';
import { VehicleMakeEntity } from '../entity/vehicle-make.entity.js';
import { VehicleModelEntity } from '../entity/vehicle-model.entity.js';
import { VehicleVariantEntity } from '../entity/vehicle-variant.entity.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

class VehicleService {
    constructor() {
        this.vehicleRepository = new VehicleRepository();
    }

    // Vehicle Make operations
    async createMake(makeData) {
        try {
            // Basic validation
            if (!makeData.name || !makeData.slug) {
                throw new Error('Name and slug are required');
            }

            // Check if make with same name already exists
            const existingMake = await this.vehicleRepository.findMakeByName(makeData.name);
            if (existingMake) {
                throw new Error(`Vehicle make "${makeData.name}" already exists`);
            }

            const make = await this.vehicleRepository.createMake(makeData);
            const makeEntity = VehicleMakeEntity.fromModel(make);
            
            return {
                success: true,
                data: makeEntity.toJSON(),
                message: 'Vehicle make created successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getMakeById(id) {
        try {
            // Validate ID
            if (!id || id === 'undefined' || id === 'null') {
                throw new Error('Invalid vehicle make ID');
            }

            const make = await this.vehicleRepository.findMakeById(id);
            
            if (!make) {
                throw new Error('Vehicle make not found');
            }

            const makeEntity = VehicleMakeEntity.fromModel(make);
            return {
                success: true,
                data: makeEntity.toJSON(),
                message: 'Vehicle make retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllMakes(filters = {}) {
        try {
            const makes = await this.vehicleRepository.findAllMakes(filters);
            const makeEntities = VehicleMakeEntity.fromModelList(makes);
            
            return {
                success: true,
                data: makeEntities.map(entity => entity.toJSON()),
                message: 'Vehicle makes retrieved successfully',
                count: makeEntities.length
            };
        } catch (error) {
            throw error;
        }
    }

    async updateMake(id, updateData) {
        try {
            // Validate ID
            if (!id || id === 'undefined' || id === 'null') {
                throw new Error('Invalid vehicle make ID');
            }

            const existingMake = await this.vehicleRepository.findMakeById(id);
            
            if (!existingMake) {
                throw new Error('Vehicle make not found');
            }

            // If new logo is provided, delete old logo from Cloudinary
            if (updateData.logo && existingMake.logo) {
                try {
                    await uploadService.deleteFromCloudinaryByUrl(existingMake.logo);
                } catch (error) {
                    console.error('Error deleting old logo:', error);
                    // Continue with update even if deletion fails
                }
            }

            const make = await this.vehicleRepository.updateMake(id, updateData);
            const makeEntity = VehicleMakeEntity.fromModel(make);
            
            return {
                success: true,
                data: makeEntity.toJSON(),
                message: 'Vehicle make updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteMake(id) {
        try {
            // Validate ID
            if (!id || id === 'undefined' || id === 'null') {
                throw new Error('Invalid vehicle make ID');
            }

            const existingMake = await this.vehicleRepository.findMakeById(id);
            
            if (!existingMake) {
                throw new Error('Vehicle make not found');
            }

            // Delete logo from Cloudinary before deleting the record
            if (existingMake.logo) {
                try {
                    await uploadService.deleteFromCloudinaryByUrl(existingMake.logo);
                } catch (error) {
                    console.error('Error deleting logo from Cloudinary:', error);
                    // Continue with deletion even if image deletion fails
                }
            }

            const make = await this.vehicleRepository.deleteMake(id);
            const makeEntity = VehicleMakeEntity.fromModel(make);
            
            return {
                success: true,
                data: makeEntity.toJSON(),
                message: 'Vehicle make deleted successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    // Vehicle Model operations
    async createModel(modelData) {
        try {
            // Basic validation
            if (!modelData.makeId || !modelData.name || !modelData.slug || !modelData.bannerImage) {
                throw new Error('Make ID, name, slug, and banner image are required');
            }

            const model = await this.vehicleRepository.createModel(modelData);
            const modelEntity = VehicleModelEntity.fromModel(model);
            
            return {
                success: true,
                data: modelEntity.toJSON(),
                message: 'Vehicle model created successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getModelById(id) {
        try {
            const model = await this.vehicleRepository.findModelById(id);
            
            if (!model) {
                throw new Error('Vehicle model not found');
            }

            const modelEntity = VehicleModelEntity.fromModel(model);
            return {
                success: true,
                data: modelEntity.toJSON(),
                message: 'Vehicle model retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllModels(filters = {}) {
        try {
            const models = await this.vehicleRepository.findAllModels(filters);
            const modelEntities = VehicleModelEntity.fromModelList(models);
            
            return {
                success: true,
                data: modelEntities.map(entity => entity.toJSON()),
                message: 'Vehicle models retrieved successfully',
                count: modelEntities.length
            };
        } catch (error) {
            throw error;
        }
    }

    async updateModel(id, updateData) {
        try {
            const existingModel = await this.vehicleRepository.findModelById(id);
            
            if (!existingModel) {
                throw new Error('Vehicle model not found');
            }

            // If new banner image is provided, delete old banner image from Cloudinary
            if (updateData.bannerImage && existingModel.bannerImage) {
                try {
                    await uploadService.deleteFromCloudinaryByUrl(existingModel.bannerImage);
                } catch (error) {
                    console.error('Error deleting old banner image:', error);
                    // Continue with update even if deletion fails
                }
            }

            // If new images are provided, delete old images from Cloudinary
            if (updateData.images && updateData.images.length > 0 && existingModel.images) {
                try {
                    for (const oldImageUrl of existingModel.images) {
                        await uploadService.deleteFromCloudinaryByUrl(oldImageUrl);
                    }
                } catch (error) {
                    console.error('Error deleting old images:', error);
                    // Continue with update even if deletion fails
                }
            }

            const model = await this.vehicleRepository.updateModel(id, updateData);
            const modelEntity = VehicleModelEntity.fromModel(model);
            
            return {
                success: true,
                data: modelEntity.toJSON(),
                message: 'Vehicle model updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteModel(id) {
        try {
            const existingModel = await this.vehicleRepository.findModelById(id);
            
            if (!existingModel) {
                throw new Error('Vehicle model not found');
            }

            // Delete banner image from Cloudinary before deleting the record
            if (existingModel.bannerImage) {
                try {
                    await uploadService.deleteFromCloudinaryByUrl(existingModel.bannerImage);
                } catch (error) {
                    console.error('Error deleting banner image from Cloudinary:', error);
                    // Continue with deletion even if image deletion fails
                }
            }

            // Delete images from Cloudinary before deleting the record
            if (existingModel.images && existingModel.images.length > 0) {
                try {
                    for (const imageUrl of existingModel.images) {
                        await uploadService.deleteFromCloudinaryByUrl(imageUrl);
                    }
                } catch (error) {
                    console.error('Error deleting images from Cloudinary:', error);
                    // Continue with deletion even if image deletion fails
                }
            }

            const model = await this.vehicleRepository.deleteModel(id);
            const modelEntity = VehicleModelEntity.fromModel(model);
            
            return {
                success: true,
                data: modelEntity.toJSON(),
                message: 'Vehicle model deleted successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    // Vehicle Variant operations
    async createVariant(variantData) {
        try {
            // Basic validation
            if (!variantData.modelId || !variantData.name || !variantData.slug || !variantData.yearRange?.startYear) {
                throw new CustomError(
                    'Model ID, name, slug, and start year are required',
                    HttpStatusCode.BAD_REQUEST,
                    true
                );
            }

            const variant = await this.vehicleRepository.createVariant(variantData);
            const variantEntity = VehicleVariantEntity.fromModel(variant);
            
            return {
                success: true,
                data: variantEntity.toJSON(),
                message: 'Vehicle variant created successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getVariantById(id) {
        try {
            const variant = await this.vehicleRepository.findVariantById(id);
            
            if (!variant) {
                throw new Error('Vehicle variant not found');
            }

            const variantEntity = VehicleVariantEntity.fromModel(variant);
            return {
                success: true,
                data: variantEntity.toJSON(),
                message: 'Vehicle variant retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllVariants(filters = {}) {
        try {
            const variants = await this.vehicleRepository.findAllVariants(filters);
            const variantEntities = VehicleVariantEntity.fromModelList(variants);
            
            return {
                success: true,
                data: variantEntities.map(entity => entity.toJSON()),
                message: 'Vehicle variants retrieved successfully',
                count: variantEntities.length
            };
        } catch (error) {
            throw error;
        }
    }

    async updateVariant(id, updateData) {
        try {
            const existingVariant = await this.vehicleRepository.findVariantById(id);
            
            if (!existingVariant) {
                throw new Error('Vehicle variant not found');
            }

            const variant = await this.vehicleRepository.updateVariant(id, updateData);
            const variantEntity = VehicleVariantEntity.fromModel(variant);
            
            return {
                success: true,
                data: variantEntity.toJSON(),
                message: 'Vehicle variant updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteVariant(id) {
        try {
            const existingVariant = await this.vehicleRepository.findVariantById(id);
            
            if (!existingVariant) {
                throw new Error('Vehicle variant not found');
            }

            const variant = await this.vehicleRepository.deleteVariant(id);
            const variantEntity = VehicleVariantEntity.fromModel(variant);
            
            return {
                success: true,
                data: variantEntity.toJSON(),
                message: 'Vehicle variant deleted successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    // Hierarchy operations
    async getModelsByMake(makeId) {
        try {
            const models = await this.vehicleRepository.findAllModels({ makeId });
            const modelEntities = VehicleModelEntity.fromModelList(models);
            
            return {
                success: true,
                data: modelEntities.map(entity => entity.toJSON()),
                message: 'Vehicle models retrieved successfully',
                count: modelEntities.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getVariantsByModel(modelId) {
        try {
            const variants = await this.vehicleRepository.findAllVariants({ modelId });
            const variantEntities = VehicleVariantEntity.fromModelList(variants);
            
            return {
                success: true,
                data: variantEntities.map(entity => entity.toJSON()),
                message: 'Vehicle variants retrieved successfully',
                count: variantEntities.length
            };
        } catch (error) {
            throw error;
        }
    }

    async findCompatibleVariants(filters = {}) {
        try {
            const variants = await this.vehicleRepository.findCompatibleVariants(filters);
            const variantEntities = VehicleVariantEntity.fromModelList(variants);
            
            return {
                success: true,
                data: variantEntities.map(entity => entity.toJSON()),
                message: 'Compatible variants retrieved successfully',
                count: variantEntities.length
            };
        } catch (error) {
            throw error;
        }
    }

    async searchVehicles(searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                throw new Error('Search term is required');
            }

            const results = await this.vehicleRepository.searchVehicles(searchTerm.trim());
            
            return {
                success: true,
                data: results,
                message: 'Vehicle search completed successfully',
                count: results.makes.length + results.models.length + results.variants.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getCompleteVehicleInfo(variantId) {
        try {
            const vehicleInfo = await this.vehicleRepository.getCompleteVehicleInfo(variantId);
            
            if (!vehicleInfo) {
                throw new Error('Vehicle not found');
            }

            return {
                success: true,
                data: vehicleInfo,
                message: 'Vehicle information retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    // Get unique vehicle models (for your original requirement)
    async getUniqueVehicleModels() {
        try {
            const models = await this.vehicleRepository.findAllModels();
            const modelEntities = VehicleModelEntity.fromModelList(models);
            
            const uniqueModels = modelEntities.map(modelEntity => ({
                id: modelEntity.id,
                make: modelEntity.make,
                name: modelEntity.name,
                displayName: modelEntity.fullName,
                images: modelEntity.images,
                variantCount: modelEntity.variantsCount
            }));

            return {
                success: true,
                data: uniqueModels,
                message: 'Unique vehicle models retrieved successfully',
                count: uniqueModels.length
            };
        } catch (error) {
            throw error;
        }
    }
}

export default VehicleService; 