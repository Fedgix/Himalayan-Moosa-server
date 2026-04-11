// error.handler.js - Enhanced version

import mongoose from 'mongoose';
import CustomError from '../../utils/custom.error.js';

/**
 * Plain-language messages for Mongoose validation (users should not see BSON/ObjectId jargon).
 */
function humanizeValidationError(error) {
  if (!(error instanceof mongoose.Error.ValidationError)) {
    return error.message;
  }
  const parts = [];
  for (const [path, sub] of Object.entries(error.errors)) {
    if (sub instanceof mongoose.Error.CastError) {
      const val = sub.value;
      if (path === 'variantId' && (val === '' || val == null)) {
        parts.push(
          'This product has no variant selected, or the selection was cleared. Choose an option if the product has sizes or colors, or add the product without a variant.'
        );
      } else if (path === 'productId') {
        parts.push('That product could not be found. Please refresh the page and try again.');
      } else if (path === 'userId') {
        parts.push('Your session could not be verified. Please sign in again.');
      } else {
        parts.push(`The value for "${path}" is not valid. Please check and try again.`);
      }
    } else {
      const msg = sub.message || '';
      if (/Cast to ObjectId failed/i.test(msg) || /BSONError/i.test(msg)) {
        parts.push(`Invalid ${path.replace(/([A-Z])/g, ' $1').trim()}. Please check your input and try again.`);
      } else {
        parts.push(msg);
      }
    }
  }
  return parts.length ? parts.join(' ') : 'Some information could not be saved. Please check and try again.';
}

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
    const path = error.path || 'id';
    let message = 'This link or ID is not valid. Please go back and try again.';
    if (path === 'variantId' && (error.value === '' || error.value == null)) {
      message =
        'No product option was selected. Choose a variant if required, or add the product without one.';
    } else if (path === 'productId') {
      message = 'That product could not be found. It may have been removed.';
    }
    return response.status(400).json({
      status: 'fail',
      error: message,
    });
  }

  // Handle Mongoose validation errors (e.g., required fields missing, bad ObjectIds)
  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({
      status: 'fail',
      error: humanizeValidationError(error),
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