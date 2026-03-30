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

/**
 * Creates a User with role "admin" in the `users` collection.
 * This does NOT work for POST /api/admin/auth/login — that route uses the `admins` collection (Admin model).
 * For the admin dashboard, run: npm run create-admin-dashboard (see scripts/create-dashboard-admin.js).
 */
// Import User model
import User from '../src/modules/users/models/user.model.js';

const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ Set MONGO_URI in server/.env.development');
            process.exit(1);
        }
        const dbName = process.env.MONGO_DB_NAME || 'moosa-garage';
        await mongoose.connect(mongoUri, { dbName });
        console.log('✅ Connected to MongoDB, database:', dbName);

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'Admin@gmail.com' });
        
        if (existingAdmin) {
            console.log('⚠️  User already exists with email: Admin@gmail.com (users collection, role admin)');
            console.log('Admin details:', {
                id: existingAdmin._id,
                name: existingAdmin.name,
                email: existingAdmin.email,
                role: existingAdmin.role,
                isActive: existingAdmin.isActive
            });
            console.log('');
            console.log('⚠️  For /api/admin/auth/login use: npm run create-admin-dashboard (admins collection).');
            return;
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash('Admin@moosa', saltRounds);

        // Create admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'Admin@gmail.com',
            password: hashedPassword, // Add password field if not exists
            role: 'admin',
            isActive: true
        });

        await adminUser.save();
        
        console.log('✅ User saved in `users` collection (role: admin).');
        console.log('Admin credentials:');
        console.log('📧 Email: Admin@gmail.com');
        console.log('🔑 Password: Admin@moosa');
        console.log('👤 Role: admin');
        console.log('🆔 ID:', adminUser._id);
        console.log('');
        console.log('⚠️  Dashboard login (/api/admin/auth/login) uses the `admins` collection, not `users`.');
        console.log('   Run: ADMIN_EMAIL=Admin@gmail.com ADMIN_PASSWORD=Admin@moosa npm run create-admin-dashboard');

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