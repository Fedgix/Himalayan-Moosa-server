import BannerService from "../services/banner.service.js";
import catchAsync from "../../../frameworks/middlewares/catch.async.js";
import { sendSuccess } from "../../../utils/response.handler.js";

class BannerController {
  constructor() {
    this.bannerService = new BannerService();
  }

  createBanner = catchAsync(async (req, res) => {
    const result = await this.bannerService.createBanner(req.body);
    return sendSuccess(res, result.message, result.data, 201);
  });

  getBannerById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.bannerService.getBannerById(id);
    return sendSuccess(res, result.message, result.data, 200);
  });

  getAllBanners = catchAsync(async (req, res) => {
    const filters = req.query;
    const result = await this.bannerService.getAllBanners(filters);
    return sendSuccess(res, result.message, result.data, 200);
  });

  getDefaultBanner = catchAsync(async (req, res) => {
    const result = await this.bannerService.getDefaultBanner();
    return sendSuccess(res, result.message, result.data, 200);
  });

  updateBanner = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.bannerService.updateBanner(id, req.body);
    return sendSuccess(res, result.message, result.data, 200);
  });

  deleteBanner = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.bannerService.deleteBanner(id);
    return sendSuccess(res, result.message, result.data, 200);
  });
}

export default BannerController;