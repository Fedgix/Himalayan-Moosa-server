import BannerRepository from "../repositories/banner.repository.js";
import { BannerEntity } from "../entity/banner.entity.js";
import { uploadService } from "../../upload/services/upload.service.js";

class BannerService {
  constructor() {
    this.bannerRepository = new BannerRepository();
  }

  async createBanner(bannerData) {
    try {
      const bannerEntity = new BannerEntity(bannerData);
      bannerEntity.validate();

      // If this banner is being set as default, ensure no other banner is default
      if (bannerEntity.isDefault) {
        await this.bannerRepository.updateMany(
          { isDefault: true },
          { isDefault: false }
        );
      }

      const banner = await this.bannerRepository.create(bannerEntity.toCreateDTO());
      const createdBannerEntity = BannerEntity.fromModel(banner);
      
      return {
        success: true,
        data: createdBannerEntity.toJSON(),
        message: 'Banner created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getBannerById(id) {
    try {
      const banner = await this.bannerRepository.findById(id);
      
      if (!banner) {
        throw new Error('Banner not found');
      }

      const bannerEntity = BannerEntity.fromModel(banner);
      return {
        success: true,
        data: bannerEntity.toJSON(),
        message: 'Banner retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllBanners(filters = {}) {
    try {
      const banners = await this.bannerRepository.findAll(filters);
      const bannerEntities = BannerEntity.fromModelList(banners);
      
      return {
        success: true,
        data: bannerEntities.map(entity => entity.toJSON()),
        message: 'Banners retrieved successfully',
        count: bannerEntities.length
      };
    } catch (error) {
      throw error;
    }
  }

  async getDefaultBanner() {
    try {
      const banner = await this.bannerRepository.findOne({ isDefault: true, isActive: true });
      
      if (!banner) {
        return {
          success: true,
          data: null,
          message: 'No default banner found'
        };
      }

      const bannerEntity = BannerEntity.fromModel(banner);
      return {
        success: true,
        data: bannerEntity.toJSON(),
        message: 'Default banner retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateBanner(id, updateData) {
    try {
      const existingBanner = await this.bannerRepository.findById(id);
      
      if (!existingBanner) {
        throw new Error('Banner not found');
      }

      // If new image is provided, delete old image from Cloudinary
      if (updateData.image && existingBanner.image && updateData.image !== existingBanner.image) {
        try {
          await uploadService.deleteFromCloudinaryByUrl(existingBanner.image);
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with update even if deletion fails
        }
      }

      // If this banner is being set as default, ensure no other banner is default
      if (updateData.isDefault) {
        await this.bannerRepository.updateMany(
          { _id: { $ne: id }, isDefault: true },
          { isDefault: false }
        );
      }

      const bannerEntity = new BannerEntity({ ...existingBanner.toObject(), ...updateData });
      bannerEntity.validate();

      const banner = await this.bannerRepository.updateById(id, bannerEntity.toUpdateDTO());
      const updatedBannerEntity = BannerEntity.fromModel(banner);
      
      return {
        success: true,
        data: updatedBannerEntity.toJSON(),
        message: 'Banner updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteBanner(id) {
    try {
      const existingBanner = await this.bannerRepository.findById(id);
      
      if (!existingBanner) {
        throw new Error('Banner not found');
      }

      // Delete image from Cloudinary before deleting the record
      if (existingBanner.image) {
        try {
          await uploadService.deleteFromCloudinaryByUrl(existingBanner.image);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue with deletion even if image deletion fails
        }
      }

      const banner = await this.bannerRepository.deleteById(id);
      const bannerEntity = BannerEntity.fromModel(banner);
      
      return {
        success: true,
        data: bannerEntity.toJSON(),
        message: 'Banner deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }
}

export default BannerService;
