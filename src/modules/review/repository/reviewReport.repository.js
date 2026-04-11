import ReviewReport from "../models/reviewReport.model.js";

class ReviewReportRepository {
    async create(data) {
        try {
            const doc = await ReviewReport.create(data);
            return doc.toObject();
        } catch (err) {
            if (err.code === 11000) {
                const e = new Error("You have already reported this review");
                e.code = "DUPLICATE_REPORT";
                throw e;
            }
            throw err;
        }
    }

    async findByReviewAndReporter(reviewId, reporterId) {
        return ReviewReport.findOne({ reviewId, reporterId }).lean();
    }
}

export default new ReviewReportRepository();
