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

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://janathagarage633:kuKPsaaE2YmZMa4o@janathagarage.nubic2v.mongodb.net/?retryWrites=true&w=majority&appName=Janathagarage';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'Admin@gmail.com' });
        
        if (existingAdmin) {
            console.log('⚠️  Admin already exists with email: Admin@gmail.com');
            console.log('Admin details:', {
                id: existingAdmin._id,
                name: existingAdmin.name,
                email: existingAdmin.email,
                role: existingAdmin.role,
                isActive: existingAdmin.isActive
            });
            return;
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash('Admin@jantha', saltRounds);

        // Create admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'Admin@gmail.com',
            password: hashedPassword, // Add password field if not exists
            role: 'admin',
            isActive: true
        });

        await adminUser.save();
        
        console.log('✅ Admin created successfully!');
        console.log('Admin credentials:');
        console.log('📧 Email: Admin@gmail.com');
        console.log('🔑 Password: Admin@jantha');
        console.log('👤 Role: admin');
        console.log('🆔 ID:', adminUser._id);

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
};

// Run the script
createAdmin(); 