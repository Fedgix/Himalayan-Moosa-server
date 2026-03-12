// error.handler.js - Enhanced version

import mongoose from 'mongoose';
import CustomError from '../../utils/custom.error.js';

export function errorHandler(error, request, response, next) {
  console.error("❌ Error caught by errorHandler:", error);

  // Handle custom application errors
  if (error instanceof CustomError) {
    // Validate status code before using it
    const statusCode = error.statusCode && typeof error.statusCode === 'number' 
      ? error.statusCode 
      : 500;
      
    return response.status(statusCode).json(error.toJson());
  }

  // Handle invalid MongoDB ObjectId (e.g., /user/invalid-id)
  if (error instanceof mongoose.Error.CastError) {
    return response.status(400).json({
      status: 'fail',
      error: `Invalid ${error.path}: ${error.value}`,
    });
  }

  // Handle Mongoose validation errors (e.g., required fields missing)
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((err) => err.message);
    return response.status(400).json({
      status: 'fail',
      error: messages.join(', '),
    });
  }

  // Handle duplicate key errors (e.g., unique email already exists)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return response.status(409).json({
      status: 'fail',
      error: `${field} must be unique — "${value}" already exists.`,
    });
  }

  // Handle DocumentNotFoundError (Mongoose)
  if (error.name === 'DocumentNotFoundError') {
    return response.status(404).json({
      status: 'fail',
      error: 'Document not found',
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({
      status: 'fail',
      error: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      status: 'fail',
      error: 'Token expired',
    });
  }

  // Log unhandled errors for debugging
  console.error('Unhandled error details:', {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack
  });

  // Generic fallback for unknown errors
  return response.status(500).json({
    status: 'error',
    error: 'Internal Server Error',
  });
}