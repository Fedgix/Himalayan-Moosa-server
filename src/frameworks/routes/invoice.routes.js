import express from 'express';
import InvoiceController from '../../modules/invoice/controller/invoice.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import catchAsync from '../middlewares/catch.async.js';

const invoiceRouter = express.Router();
invoiceRouter.use(authenticateToken)
// User routes - require authentication
invoiceRouter.get('/:orderId', catchAsync(InvoiceController.generateUserInvoice));
invoiceRouter.get('/:orderId/html', catchAsync(InvoiceController.getUserInvoiceHTML));
invoiceRouter.get('/:orderId/pdf', catchAsync(InvoiceController.downloadUserInvoicePDF));

// Admin routes - require admin authentication (you'll need to implement admin middleware)
// For now, using verifyToken - replace with admin middleware
invoiceRouter.get('/admin/order/:orderId', catchAsync(InvoiceController.generateAdminInvoice));
invoiceRouter.get('/admin/order/:orderId/html', catchAsync(InvoiceController.getAdminInvoiceHTML));
invoiceRouter.get('/admin/order/:orderId/pdf', catchAsync(InvoiceController.downloadAdminInvoicePDF));
invoiceRouter.get('/admin/invoices', catchAsync(InvoiceController.getAdminInvoices));

export default invoiceRouter;