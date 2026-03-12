import mongoose, { Schema } from "mongoose";

const vehicleMakeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  logo: {
    type: String, // URL to logo image
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
vehicleMakeSchema.index({ name: 1 });
vehicleMakeSchema.index({ slug: 1 });
vehicleMakeSchema.index({ isActive: 1 });
vehicleMakeSchema.index({ displayOrder: 1 });

// Virtual for models count
vehicleMakeSchema.virtual('modelsCount', {
  ref: 'VehicleModel',
  localField: '_id',
  foreignField: 'makeId',
  count: true
});

// Virtual for models
vehicleMakeSchema.virtual('models', {
  ref: 'VehicleModel',
  localField: '_id',
  foreignField: 'makeId'
});

const VehicleMake = mongoose.model("VehicleMake", vehicleMakeSchema);
export default VehicleMake; 