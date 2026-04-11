import mongoose, { Schema } from "mongoose";

const reviewReportSchema = new Schema(
    {
        reviewId: {
            type: Schema.Types.ObjectId,
            ref: "Review",
            required: true,
            index: true,
        },
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [500, "Reason cannot exceed 500 characters"],
            default: "",
        },
    },
    { timestamps: true }
);

reviewReportSchema.index({ reviewId: 1, reporterId: 1 }, { unique: true });

const ReviewReport = mongoose.model("ReviewReport", reviewReportSchema);
export default ReviewReport;
