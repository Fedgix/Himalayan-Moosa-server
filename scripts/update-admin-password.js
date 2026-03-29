import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
    path: path.join(__dirname, '..', '.env.development')
});

// Import User model
import User from '../src/modules/users/models/user.model.js';

const updateAdminPassword = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/moosa-garage';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ email: 'Admin@gmail.com' });
        
        if (!admin) {
            console.log('❌ Admin not found. Please run create-admin.js first.');
            return;
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash('Admin@moosa', saltRounds);

        // Update admin password
        admin.password = hashedPassword;
        await admin.save();
        
        console.log('✅ Admin password updated successfully!');
        console.log('Admin credentials:');
        console.log('📧 Email: Admin@gmail.com');
        console.log('🔑 Password: Admin@moosa');
        console.log('👤 Role: admin');
        console.log('🆔 ID:', admin._id);

    } catch (error) {
        console.error('❌ Error updating admin password:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
};

// Run the script
updateAdminPassword(); 