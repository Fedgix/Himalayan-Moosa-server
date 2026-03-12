import Order from '../../checkout/model/order.model.js';
import { CheckoutRepository } from '../../checkout/repository/checkout.repository.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';
import mongoose from 'mongoose';

export const InvoiceService = {
    /**
     * Generate invoice for a specific order
     * @param {string} orderId - The order ID
     * @param {string} userId - The user ID (optional, for user validation)
     * @returns {Object} Invoice data
     */
    generateInvoice: async (orderId, userId = null) => {
        try {
            // Validate order ID format
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                throw new CustomError('Invalid order ID format', HttpStatusCode.BAD_REQUEST, true);
            }

            // Get order details
            const order = await CheckoutRepository.getOrderById(orderId);
            
            // If userId is provided, validate ownership
            if (userId && order.userId.toString() !== userId.toString()) {
                throw new CustomError('Order not found or does not belong to user', HttpStatusCode.FORBIDDEN, true);
            }

            // Only generate invoice for paid orders
            if (order.paymentStatus !== 'paid') {
                throw new CustomError('Invoice can only be generated for paid orders', HttpStatusCode.BAD_REQUEST, true);
            }

            // Calculate invoice data
            const invoiceData = await InvoiceService.calculateInvoiceData(order);

            return {
                success: true,
                message: 'Invoice generated successfully',
                data: invoiceData
            };

        } catch (error) {
            console.error('Error generating invoice:', error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw new CustomError('Failed to generate invoice', HttpStatusCode.INTERNAL_SERVER_ERROR, true);
        }
    },

    /**
     * Calculate invoice data from order
     * @param {Object} order - Order object
     * @returns {Object} Invoice data
     */
    calculateInvoiceData: async (order) => {
        const invoiceNumber = `RZ${order.orderNumber || order.id}`;
        const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Calculate tax breakdown if needed
        const taxBreakdown = InvoiceService.calculateTaxBreakdown(order);

        return {
            invoiceNumber,
            invoiceDate,
            orderNumber: order.orderNumber || order.id,
            orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            
            // Customer details
            customer: {
                name: order.shippingAddress.fullName,
                email: order.shippingAddress.email || 'N/A',
                phone: order.shippingAddress.phoneNumber,
                address: {
                    street: order.shippingAddress.addressLine1,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    postalCode: order.shippingAddress.postalCode,
                    country: order.shippingAddress.country || 'India'
                }
            },

            // Billing address (if different from shipping)
            billingAddress: order.billingAddress ? {
                name: order.billingAddress.fullName,
                street: order.billingAddress.addressLine1,
                city: order.billingAddress.city,
                state: order.billingAddress.state,
                postalCode: order.billingAddress.postalCode,
                country: order.billingAddress.country || 'India'
            } : null,

            // Order items
            items: order.items.map(item => ({
                productName: item.productName,
                sku: item.sku,
                description: item.productDescription,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.discountPrice || item.price,
                originalPrice: item.price,
                discount: item.price - (item.discountPrice || item.price),
                total: item.itemTotal,
                image: item.image
            })),

            // Financial details
            totals: {
                subtotal: order.subtotal,
                shippingFee: order.shippingFee,
                tax: order.tax,
                discount: order.discount,
                totalAmount: order.totalAmount
            },

            // Tax breakdown
            taxBreakdown,

            // Payment details
            payment: {
                method: order.paymentMethod,
                status: order.paymentStatus,
                razorpayPaymentId: order.razorpayPaymentId,
                razorpayOrderId: order.razorpayOrderId,
                paidAt: order.updatedAt
            },

            // Order status
            orderStatus: order.orderStatus,
            
            // Company details
            company: {
                name: 'Rizo',
                address: 'Your Company Address',
                phone: 'Your Company Phone',
                email: 'rizo.ind.in@gmail.com',
                website: 'www.rizo.in',
                gstin: 'Your GSTIN Number' // Add if applicable
            }
        };
    },

    /**
     * Calculate tax breakdown (customize based on your tax structure)
     * @param {Object} order - Order object
     * @returns {Object} Tax breakdown
     */
    calculateTaxBreakdown: (order) => {
        // Customize this based on your tax structure
        // For now, returning a simple structure
        return {
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: order.tax || 0
        };
    },

    /**
     * Get invoices for admin with filtering
     * @param {Object} filters - Filter options
     * @returns {Object} Invoice list with pagination
     */
    getInvoicesForAdmin: async (filters = {}) => {
        try {
            const {
                page = 1,
                limit = 10,
                startDate,
                endDate,
                paymentStatus = 'paid',
                orderStatus,
                userId,
                search
            } = filters;

            // Build query conditions
            const matchConditions = { paymentStatus };

            if (orderStatus) matchConditions.orderStatus = orderStatus;
            if (userId) matchConditions.userId = userId;

            // Date range filter
            if (startDate || endDate) {
                matchConditions.createdAt = {};
                if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
                if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
            }

            // Search filter (order number, customer name, etc.)
            if (search) {
                matchConditions.$or = [
                    { orderNumber: { $regex: search, $options: 'i' } },
                    { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
                    { 'shippingAddress.email': { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;

            const [orders, totalCount] = await Promise.all([
                Order.find(matchConditions)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                Order.countDocuments(matchConditions)
            ]);

            // Generate invoice summaries
            const invoiceSummaries = orders.map(order => ({
                invoiceNumber: `RZ${order.orderNumber || order._id}`,
                orderId: order._id,
                orderNumber: order.orderNumber || order._id,
                customerName: order.shippingAddress.fullName,
                customerEmail: order.shippingAddress.email || 'N/A',
                totalAmount: order.totalAmount,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                createdAt: order.createdAt,
                itemCount: order.items.length,
                paymentMethod: order.paymentMethod
            }));

            return {
                success: true,
                message: 'Invoices retrieved successfully',
                data: {
                    invoices: invoiceSummaries,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        pages: Math.ceil(totalCount / limit)
                    }
                }
            };

        } catch (error) {
            console.error('Error getting invoices for admin:', error);
            throw new CustomError('Failed to retrieve invoices', HttpStatusCode.INTERNAL_SERVER_ERROR, true);
        }
    },

    /**
     * Generate invoice HTML template
     * @param {Object} invoiceData - Invoice data
     * @returns {string} HTML template
     */
    generateInvoiceHTML: (invoiceData) => {
        const {
            invoiceNumber,
            invoiceDate,
            customer,
            billingAddress,
            items,
            totals,
            payment,
            company,
            orderStatus
        } = invoiceData;

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - ${invoiceNumber}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .invoice-container {
                    border: 1px solid #e1e1e1;
                    padding: 30px;
                    border-radius: 5px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 30px;
                }
                .company-info h1 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 28px;
                }
                .invoice-details {
                    text-align: right;
                }
                .status-badge {
                    background: #27ae60;
                    color: white;
                    padding: 8px 15px;
                    border-radius: 4px;
                    display: inline-block;
                    font-weight: bold;
                    margin-top: 10px;
                }
                .address-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .address-block {
                    flex: 1;
                    margin-right: 20px;
                }
                .address-block:last-child {
                    margin-right: 0;
                }
                .address-block h3 {
                    margin: 0 0 10px 0;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                    color: #2c3e50;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .items-table th,
                .items-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                .items-table th {
                    background: #f8f9fa;
                    font-weight: bold;
                }
                .text-right {
                    text-align: right;
                }
                .text-center {
                    text-align: center;
                }
                .totals-table {
                    width: 300px;
                    margin-left: auto;
                    border-collapse: collapse;
                }
                .totals-table td {
                    padding: 8px 15px;
                    border-bottom: 1px solid #eee;
                }
                .total-row {
                    font-weight: bold;
                    font-size: 1.1em;
                    border-top: 2px solid #2c3e50;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 12px;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .invoice-container { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <!-- Header -->
                <div class="header">
                    <div class="company-info">
                        <h1>INVOICE</h1>
                        <p style="margin: 5px 0; color: #7f8c8d;">Invoice #: ${invoiceNumber}</p>
                        <p style="margin: 5px 0; color: #7f8c8d;">Date: ${invoiceDate}</p>
                    </div>
                    <div class="invoice-details">
                        <div class="status-badge">${payment.status.toUpperCase()}</div>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">Order Status: ${orderStatus}</p>
                    </div>
                </div>

                <!-- Address Section -->
                <div class="address-section">
                    <div class="address-block">
                        <h3>BILL TO</h3>
                        <p><strong>${customer.name}</strong></p>
                        <p>${customer.address.street}</p>
                        <p>${customer.address.city}, ${customer.address.state} ${customer.address.postalCode}</p>
                        <p>${customer.address.country}</p>
                        <p>Phone: ${customer.phone}</p>
                        ${customer.email !== 'N/A' ? `<p>Email: ${customer.email}</p>` : ''}
                    </div>
                    <div class="address-block">
                        <h3>PAYMENT METHOD</h3>
                        <p>${payment.method}</p>
                        ${payment.razorpayPaymentId ? `<p>Payment ID: ${payment.razorpayPaymentId}</p>` : ''}
                    </div>
                </div>

                <!-- Items Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Color/Size</th>
                            <th class="text-right">Price</th>
                            <th class="text-center">Qty</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.productName}</td>
                                <td>${item.sku}</td>
                                <td>${item.color} / ${item.size}</td>
                                <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">₹${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Totals -->
                <table class="totals-table">
                    <tr>
                        <td>Subtotal:</td>
                        <td class="text-right">₹${totals.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Shipping:</td>
                        <td class="text-right">₹${totals.shippingFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Tax:</td>
                        <td class="text-right">₹${totals.tax.toFixed(2)}</td>
                    </tr>
                    ${totals.discount > 0 ? `
                    <tr>
                        <td>Discount:</td>
                        <td class="text-right">-₹${totals.discount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td>Total:</td>
                        <td class="text-right">₹${totals.totalAmount.toFixed(2)}</td>
                    </tr>
                </table>

                <!-- Footer -->
                <div class="footer">
                    <p><strong>Thank you for your order!</strong></p>
                    <p>If you have any questions, please contact our customer support.</p>
                    <p>${company.name} | ${company.email}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
};

export default InvoiceService;