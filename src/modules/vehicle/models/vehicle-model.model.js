import mongoose, { Schema } from "mongoose";

const vehicleModelSchema = new Schema({
  makeId: {
    type: Schema.Types.ObjectId,
    ref: 'VehicleMake',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true
  },
  bannerImage: {
    type: String, // URL to banner image
    required: true
  },
  image: {
    type: String, // URL to main vehicle image (required)
    required: true
  },
  description: {
    type: String,
    default: ''
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

// Compound index for unique make+model combination
vehicleModelSchema.index({ makeId: 1, slug: 1 }, { unique: true });

// Indexes for performance
vehicleModelSchema.index({ makeId: 1 });
vehicleModelSchema.index({ isActive: 1 });
vehicleModelSchema.index({ displayOrder: 1 });

// Virtual for make reference
vehicleModelSchema.virtual('make', {
  ref: 'VehicleMake',
  localField: 'makeId',
  foreignField: '_id',
  justOne: true
});

// Virtual for variants count
vehicleModelSchema.virtual('variantsCount', {
  ref: 'VehicleVariant',
  localField: '_id',
  foreignField: 'modelId',
  count: true
});

// Virtual for variants
vehicleModelSchema.virtual('variants', {
  ref: 'VehicleVariant',
  localField: '_id',
  foreignField: 'modelId'
});

// Virtual for full vehicle name
vehicleModelSchema.virtual('fullName').get(function() {
  const segments = [this.make?.name, this.name].filter(Boolean);
  return segments.join(' ');
});

const VehicleModel = mongoose.model("VehicleModel", vehicleModelSchema);
export default VehicleModel; 