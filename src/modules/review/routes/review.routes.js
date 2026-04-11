import { Router } from "express";
import { reviewController } from "../controllers/review.controller.js";
import { authenticateToken } from "../../../frameworks/middlewares/auth.middleware.js";

const router = Router();

// Public: list reviews + summary for a product
router.get("/product/:productId", reviewController.listByProduct);

// Authenticated: CRUD own review, report
router.post("/product/:productId", authenticateToken, reviewController.create);
router.patch("/:reviewId", authenticateToken, reviewController.update);
router.delete("/:reviewId", authenticateToken, reviewController.deleteOwn);
router.post("/:reviewId/report", authenticateToken, reviewController.report);

export default router;
