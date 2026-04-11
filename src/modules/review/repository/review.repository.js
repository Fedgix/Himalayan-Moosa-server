import mongoose from "mongoose";
import Review from "../models/review.model.js";
import ReviewReport from "../models/reviewReport.model.js";

class ReviewRepository {
    async findById(reviewId) {
        return Review.findById(reviewId).lean();
    }

    async findByIdPopulated(reviewId) {
        return Review.findById(reviewId)
            .populate("userId", "name email avatar firstName lastName")
            .lean();
    }

    async findByProductAndUser(productId, userId) {
        return Review.findOne({ productId, userId }).lean();
    }

    async create(data) {
        const doc = await Review.create(data);
        return doc.toObject();
    }

    async updateById(reviewId, userId, update) {
        const doc = await Review.findOneAndUpdate(
            { _id: reviewId, userId },
            { $set: update },
            { new: true, runValidators: true }
        )
            .populate("userId", "name email avatar firstName lastName")
            .lean();
        return doc;
    }

    async deleteById(reviewId, userId) {
        const result = await Review.findOneAndDelete({ _id: reviewId, userId });
        if (result) {
            await ReviewReport.deleteMany({ reviewId });
        }
        return result;
    }

    async deleteByIdAdmin(reviewId) {
        await ReviewReport.deleteMany({ reviewId });
        return Review.findByIdAndDelete(reviewId);
    }

    async listByProduct(productId, { skip, limit }) {
        const [items, total] = await Promise.all([
            Review.find({ productId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("userId", "name email avatar firstName lastName")
                .lean(),
            Review.countDocuments({ productId }),
        ]);
        return { items, total };
    }

    async aggregateSummary(productId) {
        const [agg] = await Review.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ]);
        if (!agg) {
            return { averageRating: null, count: 0 };
        }
        return {
            averageRating: Math.round(agg.averageRating * 10) / 10,
            count: agg.count,
        };
    }
}

export default new ReviewRepository();
