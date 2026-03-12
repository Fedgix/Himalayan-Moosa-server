import express from 'express';
import { ContactFormController } from '../../modules/notification/controllers/contact.form.controller.js';
import catchAsync from '../middlewares/catch.async.js';

const contactRouter = express.Router();

// Create contact form submission
contactRouter.post('/', catchAsync(ContactFormController.createContact));

// Get all contact forms (with pagination and filtering)
contactRouter.get('/', catchAsync(ContactFormController.getAllContacts));

// Get contact statistics
contactRouter.get('/statistics', catchAsync(ContactFormController.getContactStatistics));

// Get specific contact form by ID
contactRouter.get('/:id', catchAsync(ContactFormController.getContactById));

// Update contact form status
contactRouter.patch('/:id/status', catchAsync(ContactFormController.updateContactStatus));

export default contactRouter;