import express from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/upload.controller.js';
import { uploadService } from '../services/upload.service.js';
import { authenticateFlexible } from '../../../frameworks/middlewares/flexible.auth.middleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload single image to Cloudinary
router.post('/cloudinary', 
  authenticateFlexible, 
  upload.single('image'), 
  uploadController.uploadToCloudinary
);

// Upload multiple images to Cloudinary (Batch upload)
router.post('/batch', 
  authenticateFlexible, 
  upload.array('images', 10), // Max 10 images
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No files uploaded'
        });
      }

      console.log(`📤 Batch uploading ${req.files.length} images...`);
      
      const uploadPromises = req.files.map(async (file) => {
        try {
          const result = await uploadService.uploadToCloudinary(file);
          return {
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            size: result.bytes
          };
        } catch (error) {
          console.error(`❌ Failed to upload ${file.originalname}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);
      
      console.log(`✅ Successfully uploaded ${results.length} images`);

      res.status(200).json({
        status: 'success',
        message: 'Files uploaded successfully',
        data: {
          urls: results.map(r => r.url),
          details: results
        }
      });
    } catch (error) {
      console.error('❌ Batch upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload files',
        error: error.message
      });
    }
  }
);

// Delete image from Cloudinary
router.delete('/cloudinary', 
  authenticateFlexible, 
  uploadController.deleteFromCloudinary
);

export default router; 