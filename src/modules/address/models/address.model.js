
import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    required: true,
    maxlength: 10
  },
  addressLine1: {
    type: String,
    required: true,
    maxlength: 255
  },
  addressLine2: {
    type: String,
    default: '',
    maxlength: 255
  },
  landmark: {
    type: String,
    default: '',
    maxlength: 100
  },
  city: {
    type: String,
    required: true,
    maxlength: 100
  },
  state: {
    type: String,
    required: true,
    maxlength: 100
  },
  pinCode: {
    type: String,
    required: true,
    maxlength: 6
  },
  country: {
    type: String,
    required: true,
    default: 'India',
    maxlength: 50
  },
  addressType: {
    type: String,
    enum: ['HOME', 'WORK', 'OTHER'],
    default: 'HOME'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes with corrected field names
AddressSchema.index({ userId: 1 });
AddressSchema.index({ userId: 1, isDefault: 1 });
AddressSchema.index({ pinCode: 1 });

export const AddressModel = mongoose.model('Address', AddressSchema);
