/**
 * Creates a row in the `admins` collection (Admin model).
 * Used by POST /api/admin/auth/login — not the same as User.role === 'admin'.
 *
 * From server folder:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='yourSecurePass' node scripts/create-dashboard-admin.js
 *
 * Optional: ADMIN_NAME="Site Admin" ADMIN_ROLE=admin|super_admin
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Admin from '../src/modules/admin/models/admin.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || '';
const name = (process.env.ADMIN_NAME || 'Admin').trim();
const role = process.env.ADMIN_ROLE === 'super_admin' ? 'super_admin' : 'admin';

async function main() {
  if (!email) {
    console.error('❌ Set ADMIN_EMAIL (e.g. ADMIN_EMAIL=admin@site.com)');
    process.exit(1);
  }
  if (!password || password.length < 6) {
    console.error('❌ Set ADMIN_PASSWORD (min 6 characters)');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI missing in env file');
    process.exit(1);
  }

  // Must match src/config/db.js — otherwise admins are written to a different DB than the API uses.
  const dbName = process.env.MONGO_DB_NAME || 'moosa-garage';
  await mongoose.connect(mongoUri, { dbName });
  console.log('✅ Connected to MongoDB, database:', dbName);

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('⚠️  Admin already exists:', email);
    console.log('   id:', existing._id, 'role:', existing.role);
    await mongoose.connection.close();
    return;
  }

  await Admin.create({
    name,
    email,
    password,
    role,
    isActive: true,
  });

  console.log('✅ Dashboard admin created');
  console.log('   📧', email);
  console.log('   👤', name, `(${role})`);
  console.log('   Login: POST /api/admin/auth/login');

  await mongoose.connection.close();
  console.log('🔌 Disconnected');
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
