import './env.js';
import { v2 as cloudinary } from 'cloudinary';

/** Trim .env values (spaces/quotes break Cloudinary auth). */
const envTrim = (v) => {
  if (v == null || v === '') return '';
  return String(v).trim().replace(/^["']|["']$/g, '');
};

const cloudName = envTrim(process.env.CLOUDINARY_CLOUD_NAME);
const apiKey = envTrim(process.env.CLOUDINARY_API_KEY);
const apiSecret = envTrim(process.env.CLOUDINARY_API_SECRET);

if (!cloudName || !apiKey || !apiSecret) {
  console.warn(
    '⚠️ Cloudinary env missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.development/.env.production'
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;