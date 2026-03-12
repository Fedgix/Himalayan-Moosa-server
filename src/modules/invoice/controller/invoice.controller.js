import InvoiceService from '../services/invoice.service.js';
import { sendSuccess } from '../../../utils/response.handler.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';
import CustomError from '../../../utils/custom.error.js';

export const InvoiceController = {
    /**
     * Generate invoice for a specific order (User endpoint)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    generateUserInvoice: async (req, res) => {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;
            
            if (!orderId) {
                throw new CustomError('Order ID is required', HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await InvoiceService.generateInvoice(orderId, userId);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generate invoice HTML for a specific order (User endpoint)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getUserInvoiceHTML: async (req, res) => {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;
            
            if (!orderId) {
                throw new CustomError('Order ID is required', HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await InvoiceService.generateInvoice(orderId, userId);
            const htmlContent = InvoiceService.generateInvoiceHTML(result.data);
            
            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Download invoice as PDF (User endpoint)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    downloadUserInvoicePDF: async (req, res) => {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;
            
            if (!orderId) {
                throw new CustomError('Order ID is required', HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await InvoiceService.generateInvoice(orderId, userId);
            const htmlContent = InvoiceService.generateInvoiceHTML(result.data);
            
            // Note: You'll need to implement PDF generation
            // This is a placeholder for PDF generation functionality
            // You can use libraries like puppeteer, html-pdf, or similar
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${result.data.invoiceNumber}.pdf`);
            
            // For now, return HTML - implement PDF generation as needed
            res.send(htmlContent);
        } catch (error) {
            throw error;
        }
    },

    // Admin endpoints
    /**
     * Generate invoice for any order (Admin endpoint)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    generateAdminInvoice: async (req, res) => {
        try {
            const { orderId } = req.params;
            
            if (!orderId) {
                throw new CustomError('Order ID is required', HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await InvoiceService.generateInvoice(orderId);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Generate invoice HTML for any order (Admin endpoint)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getAdminInvoiceHTML: async (req, res) => {
        try {
            const { orderId } = req.params;
            
            if (!orderId) {
                throw new CustomError('Order ID is required', HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await InvoiceService.generateInvoice(orderId);
            const htmlContent = InvoiceService.generateInvoiceHTML(result.data);
            
            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get all invoices with filtering (Admin endpoint)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getAdminInvoices: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                startDate,
                endDate,
                paymentStatus,
                orderStatus,
                userId,
                search
            } = req.query;

            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                startDate,
                endDate,
                paymentStatus,
                orderStatus,
                userId,
                search
            };

            const result = await InvoiceService.getInvoicesForAdmin(filters);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Download invoice as PDF (Admin endpoint)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    downloadAdminInvoicePDF: async (req, res) => {
        try {
            const { orderId } = req.params;
            
            if (!orderId) {
                throw new CustomError('Order ID is required', HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await InvoiceService.generateInvoice(orderId);
            const htmlContent = InvoiceService.generateInvoiceHTML(result.data);
            
            // Note: You'll need to implement PDF generation
            // This is a placeholder for PDF generation functionality
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${result.data.invoiceNumber}.pdf`);
            
            // For now, return HTML - implement PDF generation as needed
            res.send(htmlContent);
        } catch (error) {
            throw error;
        }
    }
};

export default InvoiceController;