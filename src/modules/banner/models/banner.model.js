import mongoose, { Schema } from "mongoose";

const bannerSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ isDefault: 1 });
bannerSchema.index({ order: 1 });

// Pre-save middleware to ensure only one default banner
bannerSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Set all other banners to non-default
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner; 