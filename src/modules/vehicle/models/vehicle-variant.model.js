import mongoose, { Schema } from "mongoose";

const vehicleVariantSchema = new Schema({
  modelId: {
    type: Schema.Types.ObjectId,
    ref: 'VehicleModel',
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
  yearRange: {
    startYear: {
      type: Number,
      required: true
    },
    endYear: {
      type: Number,
      default: null // null means ongoing
    }
  },
  engineSpecs: {
    type: String,
    default: ''
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
    default: 'Petrol'
  },
  transmission: {
    type: String,
    enum: ['Manual', 'Automatic', 'CVT', 'AMT'],
    default: 'Manual'
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
vehicleVariantSchema.index({ modelId: 1 });
vehicleVariantSchema.index({ isActive: 1 });
vehicleVariantSchema.index({ 'yearRange.startYear': 1 });
vehicleVariantSchema.index({ 'yearRange.endYear': 1 });
vehicleVariantSchema.index({ fuelType: 1 });
vehicleVariantSchema.index({ transmission: 1 });

// Virtual for model reference
vehicleVariantSchema.virtual('model', {
  ref: 'VehicleModel',
  localField: 'modelId',
  foreignField: '_id',
  justOne: true
});

// Virtual for make reference through model
vehicleVariantSchema.virtual('make', {
  ref: 'VehicleMake',
  localField: 'model.makeId',
  foreignField: '_id',
  justOne: true
});

// Virtual for full vehicle name with variant and year
vehicleVariantSchema.virtual('fullName').get(function() {
  const yearText = this.yearRange.endYear 
    ? `${this.yearRange.startYear}-${this.yearRange.endYear}`
    : `${this.yearRange.startYear}+`;
  return `${this.model?.make?.name} ${this.model?.name} ${this.name} (${yearText})`;
});

// Virtual for current year compatibility
vehicleVariantSchema.virtual('isCurrentYearCompatible').get(function() {
  const currentYear = new Date().getFullYear();
  return currentYear >= this.yearRange.startYear && 
         (!this.yearRange.endYear || currentYear <= this.yearRange.endYear);
});

const VehicleVariant = mongoose.model("VehicleVariant", vehicleVariantSchema);
export default VehicleVariant; 