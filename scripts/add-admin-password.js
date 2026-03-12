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

const addAdminPassword = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/janatha-garage';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ email: 'Admin@gmail.com' });
        
        if (!admin) {
            console.log('❌ Admin not found. Creating new admin...');
            
            // Create new admin with password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash('Admin@jantha', saltRounds);
            
            const newAdmin = new User({
                name: 'Admin User',
                email: 'Admin@gmail.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true
            });
            
            await newAdmin.save();
            console.log('✅ New admin created with password!');
            console.log('Admin ID:', newAdmin._id);
        } else {
            console.log('✅ Admin found:', admin._id);
            
            // Check if admin has password
            if (!admin.password) {
                console.log('🔑 Adding password to existing admin...');
                
                // Hash password
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash('Admin@jantha', saltRounds);
                
                // Update admin with password
                admin.password = hashedPassword;
                await admin.save();
                
                console.log('✅ Password added to existing admin!');
            } else {
                console.log('🔑 Admin already has password');
            }
        }
        
        // Verify admin details
        const updatedAdmin = await User.findOne({ email: 'Admin@gmail.com' });
        console.log('\n📋 Final Admin Details:');
        console.log('🆔 ID:', updatedAdmin._id);
        console.log('📧 Email:', updatedAdmin.email);
        console.log('👤 Name:', updatedAdmin.name);
        console.log('🔑 Has Password:', !!updatedAdmin.password);
        console.log('👑 Role:', updatedAdmin.role);
        console.log('✅ Is Active:', updatedAdmin.isActive);
        
        console.log('\n🔐 Login Credentials:');
        console.log('📧 Email: Admin@gmail.com');
        console.log('🔑 Password: Admin@jantha');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
};

// Run the script
addAdminPassword(); 