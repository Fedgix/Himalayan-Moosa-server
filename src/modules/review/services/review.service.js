import mongoose from "mongoose";
import Product from "../../product/models/product.model.js";
import reviewRepository from "../repository/review.repository.js";
import reviewReportRepository from "../repository/reviewReport.repository.js";
import CustomError from "../../../utils/custom.error.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";

function formatUser(u) {
    if (u == null) return null;
    if (typeof u !== "object" || u instanceof mongoose.Types.ObjectId) return null;
    const id = u._id?.toString?.() ?? u.id?.toString?.() ?? String(u._id ?? u.id);
    const name =
        u.name ||
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        "";
    return {
        id,
        name,
        email: u.email ?? null,
        avatar: u.avatar ?? null,
    };
}

function formatReview(doc) {
    if (!doc) return null;
    const userRaw = doc.userId;
    return {
        id: doc._id?.toString?.() ?? doc.id,
        productId: doc.productId?.toString?.() ?? doc.productId,
        userId: userRaw?._id?.toString?.() ?? userRaw?.toString?.() ?? doc.userId?.toString?.(),
        rating: doc.rating,
        title: doc.title ?? "",
        comment: doc.comment ?? "",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        user: formatUser(userRaw),
    };
}

class ReviewService {
    async listByProduct(productId, query) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new CustomError("Invalid product ID", HttpStatusCode.BAD_REQUEST, true);
        }
        const product = await Product.findById(productId).select("_id").lean();
        if (!product) {
            throw new CustomError("Product not found", HttpStatusCode.NOT_FOUND, true);
        }

        const page = Math.max(1, parseInt(query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const { items, total } = await reviewRepository.listByProduct(productId, { skip, limit });
        const summary = await reviewRepository.aggregateSummary(productId);

        return {
            message: "Reviews retrieved successfully",
            data: {
                reviews: items.map(formatReview),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: limit ? Math.ceil(total / limit) : 0,
                },
                summary,
            },
        };
    }

    async create(userId, productId, body) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new CustomError("Invalid product ID", HttpStatusCode.BAD_REQUEST, true);
        }
        const product = await Product.findById(productId).select("_id isActive").lean();
        if (!product) {
            throw new CustomError("Product not found", HttpStatusCode.NOT_FOUND, true);
        }
        if (!product.isActive) {
            throw new CustomError("This product is not available for reviews", HttpStatusCode.BAD_REQUEST, true);
        }

        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new CustomError("Rating must be a whole number between 1 and 5", HttpStatusCode.BAD_REQUEST, true);
        }

        const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
        const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 5000) : "";

        const uid = new mongoose.Types.ObjectId(userId);
        const pid = new mongoose.Types.ObjectId(productId);

        const existing = await reviewRepository.findByProductAndUser(pid, uid);
        if (existing) {
            throw new CustomError(
                "You already reviewed this product. You can edit your existing review.",
                HttpStatusCode.CONFLICT,
                true
            );
        }

        const created = await reviewRepository.create({
            productId: pid,
            userId: uid,
            rating,
            title,
            comment,
        });

        const full = await reviewRepository.findByIdPopulated(created._id);
        return {
            message: "Review added successfully",
            data: { review: formatReview(full) },
        };
    }

    async update(userId, reviewId, body) {
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            throw new CustomError("Invalid review ID", HttpStatusCode.BAD_REQUEST, true);
        }

        const rating =
            body.rating !== undefined ? Number(body.rating) : undefined;
        if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
            throw new CustomError("Rating must be a whole number between 1 and 5", HttpStatusCode.BAD_REQUEST, true);
        }

        const update = {};
        if (rating !== undefined) update.rating = rating;
        if (body.title !== undefined) {
            update.title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
        }
        if (body.comment !== undefined) {
            update.comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 5000) : "";
        }

        if (Object.keys(update).length === 0) {
            throw new CustomError("Nothing to update", HttpStatusCode.BAD_REQUEST, true);
        }

        const uid = new mongoose.Types.ObjectId(userId);
        const updated = await reviewRepository.updateById(reviewId, uid, update);
        if (!updated) {
            throw new CustomError("Review not found or you cannot edit it", HttpStatusCode.NOT_FOUND, true);
        }
        return {
            message: "Review updated successfully",
            data: { review: formatReview(updated) },
        };
    }

    async deleteOwn(userId, reviewId) {
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            throw new CustomError("Invalid review ID", HttpStatusCode.BAD_REQUEST, true);
        }
        const uid = new mongoose.Types.ObjectId(userId);
        const deleted = await reviewRepository.deleteById(reviewId, uid);
        if (!deleted) {
            throw new CustomError("Review not found or you cannot delete it", HttpStatusCode.NOT_FOUND, true);
        }
        return { message: "Review deleted successfully", data: { id: reviewId } };
    }

    async report(reporterUserId, reviewId, body) {
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            throw new CustomError("Invalid review ID", HttpStatusCode.BAD_REQUEST, true);
        }
        const review = await reviewRepository.findById(reviewId);
        if (!review) {
            throw new CustomError("Review not found", HttpStatusCode.NOT_FOUND, true);
        }

        const rid = review.userId.toString();
        if (rid === reporterUserId.toString()) {
            throw new CustomError("You cannot report your own review", HttpStatusCode.BAD_REQUEST, true);
        }

        const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";

        try {
            await reviewReportRepository.create({
                reviewId: new mongoose.Types.ObjectId(reviewId),
                reporterId: new mongoose.Types.ObjectId(reporterUserId),
                reason,
            });
        } catch (e) {
            if (e.code === "DUPLICATE_REPORT") {
                throw new CustomError("You have already reported this review", HttpStatusCode.CONFLICT, true);
            }
            throw e;
        }

        return {
            message: "Report submitted. Thank you for helping keep reviews trustworthy.",
            data: { reviewId },
        };
    }

    async adminRemove(reviewId) {
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            throw new CustomError("Invalid review ID", HttpStatusCode.BAD_REQUEST, true);
        }
        const deleted = await reviewRepository.deleteByIdAdmin(reviewId);
        if (!deleted) {
            throw new CustomError("Review not found", HttpStatusCode.NOT_FOUND, true);
        }
        return { message: "Review removed by admin", data: { id: reviewId } };
    }
}

export default new ReviewService();
