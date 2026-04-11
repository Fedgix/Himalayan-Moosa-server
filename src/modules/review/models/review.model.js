import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
        },
        title: {
            type: String,
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
            default: "",
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [5000, "Comment cannot exceed 5000 characters"],
            default: "",
        },
    },
    { timestamps: true }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
