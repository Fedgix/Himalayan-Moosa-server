import { Router } from "express";
import BannerController from "../../modules/banner/controllers/banner.controller.js";

const router = Router();
const bannerController = new BannerController();

// Banner CRUD routes
router.post('/', bannerController.createBanner);
router.get('/', bannerController.getAllBanners);
router.get('/default', bannerController.getDefaultBanner);
router.get('/:id', bannerController.getBannerById);
router.put('/:id', bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);

export default router;