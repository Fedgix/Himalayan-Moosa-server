import Banner from "../models/banner.model.js";

class BannerRepository {
  async create(bannerData) {
    try {
      const banner = new Banner(bannerData);
      const savedBanner = await banner.save();
      return savedBanner;
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      const banner = await Banner.findById(id);
      return banner;
    } catch (error) {
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      const query = {};
      
      // Only show active banners by default
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      } else {
        query.isActive = true;
      }
      
      if (filters.title) {
        query.title = { $regex: filters.title, $options: 'i' };
      }
      
      if (filters.isDefault !== undefined) {
        query.isDefault = filters.isDefault;
      }

      const banners = await Banner.find(query)
        .sort({ order: 1, createdAt: -1 });
      
      return banners;
    } catch (error) {
      throw error;
    }
  }

  async findWithPagination(filter = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { priority: -1, displayOrder: 1 } } = options;
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        Banner.find(filter)
          .sort(sort)
            .skip(skip)
          .limit(limit),
        Banner.countDocuments(filter)
      ]);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async updateById(id, updateData) {
    try {
      const banner = await Banner.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      return banner;
    } catch (error) {
      throw error;
    }
  }

  async updateMany(filter, updateData) {
    try {
      const result = await Banner.updateMany(filter, updateData, { runValidators: true });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter) {
    try {
      const banner = await Banner.findOne(filter);
      return banner;
    } catch (error) {
      throw error;
    }
  }

  async deleteById(id) {
    try {
      const banner = await Banner.findByIdAndDelete(id);
      return banner;
    } catch (error) {
      throw error;
    }
  }

  async getActiveBannersByLocation(location, device = 'desktop') {
    try {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const query = {
        isActive: true,
        'targeting.locations': { $in: [location, 'all'] },
        $or: [
          { 'schedule.startDate': { $lte: now } },
          { 'schedule.startDate': { $exists: false } }
        ],
        $or: [
          { 'schedule.endDate': { $gte: now } },
          { 'schedule.endDate': { $exists: false } },
          { 'schedule.endDate': null }
        ]
      };

      // Check recurring schedule
      query.$or = [
        { 'schedule.isRecurring': false },
        {
          'schedule.isRecurring': true,
          'schedule.recurringDays': currentDay,
          'schedule.startTime': { $lte: currentTime },
          'schedule.endTime': { $gte: currentTime }
        }
      ];

      // Device targeting
      query['targeting.devices'] = { $in: [device, 'all'] };

      const banners = await Banner.find(query)
        .sort({ priority: -1, displayOrder: 1, createdAt: -1 });
      
      return banners;
    } catch (error) {
      throw error;
    }
  }

  async getFeaturedBanners(limit = 5) {
    try {
      const banners = await Banner.find({ 
        isActive: true, 
        isFeatured: true 
      })
        .sort({ priority: -1, displayOrder: 1, createdAt: -1 })
        .limit(limit);
      
      return banners;
    } catch (error) {
      throw error;
    }
  }

  async searchBanners(searchTerm) {
    try {
      const banners = await Banner.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { title: { $regex: searchTerm, $options: 'i' } },
              { subtitle: { $regex: searchTerm, $options: 'i' } },
              { description: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        ]
      }).sort({ priority: -1, displayOrder: 1, createdAt: -1 });
      
      return banners;
    } catch (error) {
      throw error;
    }
  }

  async incrementViews(bannerId) {
    try {
      const banner = await Banner.findByIdAndUpdate(
        bannerId,
        { $inc: { views: 1, impressions: 1 } },
        { new: true }
      );
      
      return banner;
    } catch (error) {
      throw error;
    }
  }

  async incrementClicks(bannerId) {
    try {
      const banner = await Banner.findByIdAndUpdate(
        bannerId,
        { $inc: { clicks: 1 } },
        { new: true }
      );
      
      return banner;
    } catch (error) {
      throw error;
    }
  }

  async getBannerAnalytics(bannerId) {
    try {
      const banner = await Banner.findById(bannerId)
        .select('title views clicks impressions');
      
      if (!banner) {
        throw new Error('Banner not found');
      }

      const ctr = banner.impressions > 0 ? (banner.clicks / banner.impressions) * 100 : 0;
      
      return {
        bannerId: banner._id,
        title: banner.title,
        views: banner.views,
        clicks: banner.clicks,
        impressions: banner.impressions,
        ctr: Math.round(ctr * 100) / 100
      };
    } catch (error) {
      throw error;
    }
  }
}

export default BannerRepository;
