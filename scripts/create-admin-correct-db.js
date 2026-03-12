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

const createAdminInCorrectDB = async () => {
    try {
        // Get MongoDB URI from environment
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
        
        console.log('🔗 Connecting to MongoDB...');
        console.log('📊 Database URI:', MONGO_URI);
        console.log('🗄️  Database Name: janatha-garage');
        
        // Connect to MongoDB with correct database name
        await mongoose.connect(MONGO_URI, { 
            dbName: 'janatha-garage'
        });
        console.log('✅ Connected to MongoDB with database: janatha-garage');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'Admin@gmail.com' });
        
        if (existingAdmin) {
            console.log('⚠️  Admin already exists in janatha-garage database');
            console.log('Admin details:', {
                id: existingAdmin._id,
                name: existingAdmin.name,
                email: existingAdmin.email,
                role: existingAdmin.role,
                isActive: existingAdmin.isActive,
                hasPassword: !!existingAdmin.password
            });
            
            // Update password if needed
            if (!existingAdmin.password) {
                console.log('🔑 Adding password to existing admin...');
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash('Admin@jantha', saltRounds);
                existingAdmin.password = hashedPassword;
                await existingAdmin.save();
                console.log('✅ Password added to existing admin');
            }
        } else {
            console.log('➕ Creating new admin in janatha-garage database...');
            
            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash('Admin@jantha', saltRounds);

            // Create admin user
            const adminUser = new User({
                name: 'Admin User',
                email: 'Admin@gmail.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true
            });

            await adminUser.save();
            console.log('✅ Admin created successfully in janatha-garage database!');
            console.log('Admin ID:', adminUser._id);
        }
        
        // Verify admin exists
        const verifiedAdmin = await User.findOne({ email: 'Admin@gmail.com' });
        console.log('\n📋 Final Admin Details:');
        console.log('🆔 ID:', verifiedAdmin._id);
        console.log('📧 Email:', verifiedAdmin.email);
        console.log('👤 Name:', verifiedAdmin.name);
        console.log('🔑 Has Password:', !!verifiedAdmin.password);
        console.log('👑 Role:', verifiedAdmin.role);
        console.log('✅ Is Active:', verifiedAdmin.isActive);
        
        console.log('\n🔐 Login Credentials:');
        console.log('📧 Email: Admin@gmail.com');
        console.log('🔑 Password: Admin@jantha');
        
        console.log('\n🗄️  Database Info:');
        console.log('Database Name:', mongoose.connection.db.databaseName);
        console.log('Collection:', User.collection.name);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
};

// Run the script
createAdminInCorrectDB(); 