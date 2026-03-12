import cloudinary from '../../../config/cloudinary.js';
import { Readable } from 'stream';

export const uploadService = {
  uploadToCloudinary: async (file) => {
    try {
      // Convert buffer to stream
      const stream = Readable.from(file.buffer);
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'janatha-garage',
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.pipe(uploadStream);
      });
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  },

  deleteFromCloudinary: async (public_id) => {
    try {
      const result = await cloudinary.uploader.destroy(public_id);
      return result;
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  },

  deleteFromCloudinaryByUrl: async (imageUrl) => {
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const public_id = filename.split('.')[0];
      
      // Remove folder path if exists
      const folderPath = 'janatha-garage/';
      const finalPublicId = public_id.replace(folderPath, '');
      
      const result = await cloudinary.uploader.destroy(finalPublicId);
      return result;
    } catch (error) {
      console.error('Error deleting image by URL:', error);
      // Don't throw error if image doesn't exist
      return { result: 'ok' };
    }
  },

  uploadMultipleToCloudinary: async (files) => {
    try {
      const uploadPromises = files.map(file => uploadService.uploadToCloudinary(file));
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw new Error(`Multiple upload failed: ${error.message}`);
    }
  }
}; 