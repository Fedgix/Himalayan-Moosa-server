import { uploadService } from '../services/upload.service.js';

export const uploadController = {
  uploadToCloudinary: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      const result = await uploadService.uploadToCloudinary(req.file);
      
      res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          size: result.bytes
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload file',
        error: error.message
      });
    }
  },

  deleteFromCloudinary: async (req, res) => {
    try {
      const { public_id } = req.body;
      
      if (!public_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Public ID is required'
        });
      }

      const result = await uploadService.deleteFromCloudinary(public_id);
      
      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete file',
        error: error.message
      });
    }
  }
}; 