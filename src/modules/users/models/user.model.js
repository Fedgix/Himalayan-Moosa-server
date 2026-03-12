import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true },
  firstName: { type: String },
  lastName: { type: String },
  name: { type: String }, // Full name; for Google users or computed from firstName + lastName
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Hashed; for email/password login
  avatar: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.index({ googleId: 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);
export default User;