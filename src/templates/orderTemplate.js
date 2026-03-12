import { formatTimestamp } from '../utils/emailUtils.js';

/**
 * Generates order items HTML for templates
 * @param {Object} orderData - Order data
 * @returns {string} HTML string for order items
 */
const generateOrderItemsHTML = (orderData) => {
    if (orderData.items && orderData.items.length > 0) {
        return orderData.items.map(item => `
        <div class="order-item">
            <strong>${item.productName}</strong><br>
            SKU: ${item.sku}<br>
            ${item.color ? `Color: ${item.color}<br>` : ''}
            ${item.size ? `Size: ${item.size}<br>` : ''}
            Quantity: ${item.quantity}<br>
            Unit Price: ₹${item.unitPrice}<br>
            Subtotal: ₹${item.subtotal}
        </div>
        `).join('');
    } else {
        return `
        <div class="order-item">
            <strong>${orderData.productName}</strong><br>
            SKU: ${orderData.productSku}<br>
            Quantity: ${orderData.quantity}<br>
            Unit Price: ₹${orderData.unitPrice}<br>
            Subtotal: ₹${orderData.subtotal || (orderData.quantity * orderData.unitPrice)}
        </div>
        `;
    }
};

/**
 * Generates order items text for templates
 * @param {Object} orderData - Order data
 * @returns {string} Text string for order items
 */
const generateOrderItemsText = (orderData) => {
    if (orderData.items && orderData.items.length > 0) {
        return orderData.items.map(item => `
- ${item.productName}
  SKU: ${item.sku}
  ${item.color ? `Color: ${item.color}` : ''}
  ${item.size ? `Size: ${item.size}` : ''}
  Quantity: ${item.quantity}
  Unit Price: ₹${item.unitPrice}
  Subtotal: ₹${item.subtotal}
`).join('');
    } else {
        return `
- ${orderData.productName}
  SKU: ${orderData.productSku}
  Quantity: ${orderData.quantity}
  Unit Price: ₹${orderData.unitPrice}
  Subtotal: ₹${orderData.subtotal || (orderData.quantity * orderData.unitPrice)}
`;
    }
};

/**
 * Generates shipping address HTML
 * @param {Object} shippingAddress - Shipping address data
 * @returns {string} HTML string for shipping address
 */
const generateShippingAddressHTML = (shippingAddress) => {
    if (!shippingAddress) return '';
    
    return `
    <div class="shipping-info">
        <h3>Shipping Address:</h3>
        <p>
            ${shippingAddress.name}<br>
            ${shippingAddress.addressLine1}<br>
            ${shippingAddress.addressLine2 ? `${shippingAddress.addressLine2}<br>` : ''}
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.pincode}<br>
            ${shippingAddress.country}<br>
            Phone: ${shippingAddress.phone}
        </p>
    </div>
    `;
};

/**
 * Generates shipping address text
 * @param {Object} shippingAddress - Shipping address data
 * @returns {string} Text string for shipping address
 */
const generateShippingAddressText = (shippingAddress) => {
    if (!shippingAddress) return '';
    
    return `
SHIPPING ADDRESS:
${shippingAddress.name}
${shippingAddress.addressLine1}
${shippingAddress.addressLine2 ? shippingAddress.addressLine2 : ''}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.pincode}
${shippingAddress.country}
Phone: ${shippingAddress.phone}
`;
};

/**
 * Generates HTML template for order confirmation emails
 * @param {Object} orderData - Order data
 * @returns {string} HTML template string
 */
export const generateOrderConfirmationTemplate = (orderData) => {
    const timestamp = formatTimestamp(orderData.orderDate);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .order-item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .order-item:last-child { border-bottom: none; }
            .total { font-size: 18px; font-weight: bold; color: #28a745; text-align: right; margin-top: 15px; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; }
            .shipping-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📦 Order Confirmation</h2>
                <p>Order #${orderData.orderId}</p>
            </div>
            <div class="content">
                <p>Dear ${orderData.customerName},</p>
                <p>Thank you for your order! We've received your order and it's being processed.</p>
                
                <div class="order-details">
                    <h3>Order Details:</h3>
                    ${generateOrderItemsHTML(orderData)}
                    
                    <div class="total">
                        Total Amount: ₹${orderData.totalAmount}
                    </div>
                </div>
                
                ${generateShippingAddressHTML(orderData.shippingAddress)}
                
                <p><strong>Order Date:</strong> ${timestamp}</p>
                <p><strong>Status:</strong> ${orderData.status || 'Processing'}</p>
                <p><strong>Expected Delivery:</strong> ${orderData.expectedDelivery || '5-7 business days'}</p>
                
                <p>We'll send you another email with tracking information once your order ships.</p>
            </div>
            <div class="footer">
                <p>Thank you for shopping with us!</p>
                <small>If you have any questions, please contact our customer service.</small>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generates plain text template for order confirmation emails
 * @param {Object} orderData - Order data
 * @returns {string} Plain text template string
 */
export const generateOrderConfirmationTextTemplate = (orderData) => {
    const timestamp = formatTimestamp(orderData.orderDate);

    return `
📦 ORDER CONFIRMATION

Order #${orderData.orderId}

Dear ${orderData.customerName},

Thank you for your order! We've received your order and it's being processed.

ORDER DETAILS:
${generateOrderItemsText(orderData)}

Total Amount: ₹${orderData.totalAmount}

${generateShippingAddressText(orderData.shippingAddress)}

Order Date: ${timestamp}
Status: ${orderData.status || 'Processing'}
Expected Delivery: ${orderData.expectedDelivery || '5-7 business days'}

We'll send you another email with tracking information once your order ships.

Thank you for shopping with us!
    `;
};

/**
 * Generates HTML template for admin order notification emails
 * @param {Object} orderData - Order data
 * @returns {string} HTML template string
 */
export const generateOrderNotificationTemplate = (orderData) => {
    const timestamp = formatTimestamp(orderData.orderDate);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .order-item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .order-item:last-child { border-bottom: none; }
            .total { font-size: 18px; font-weight: bold; color: #dc3545; text-align: right; margin-top: 15px; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; }
            .customer-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .urgent { background: #ff6b6b; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🛒 New Order Received</h2>
                <p>Order #${orderData.orderId}</p>
            </div>
            <div class="content">
                <div class="urgent">
                    ⚡ ACTION REQUIRED: Process this order immediately
                </div>
                
                <div class="customer-info">
                    <h3>Customer Information:</h3>
                    <p>
                        <strong>Name:</strong> ${orderData.customerName}<br>
                        <strong>Email:</strong> <a href="mailto:${orderData.customerEmail}">${orderData.customerEmail}</a><br>
                        ${orderData.customerPhone ? `<strong>Phone:</strong> <a href="tel:${orderData.customerPhone}">${orderData.customerPhone}</a><br>` : ''}
                    </p>
                </div>
                
                <div class="order-details">
                    <h3>Order Details:</h3>
                    ${generateOrderItemsHTML(orderData)}
                    
                    <div class="total">
                        Total Amount: ₹${orderData.totalAmount}
                    </div>
                </div>
                
                ${generateShippingAddressHTML(orderData.shippingAddress)}
                
                <p><strong>Order Date:</strong> ${timestamp}</p>
                <p><strong>Status:</strong> ${orderData.status || 'Processing'}</p>
                <p><strong>Payment Method:</strong> ${orderData.paymentMethod || 'Not specified'}</p>
                <p><strong>Notes:</strong> ${orderData.notes || 'No special instructions'}</p>
            </div>
            <div class="footer">
                <p>Please process this order as soon as possible!</p>
                <small>This is an automated notification from your e-commerce system.</small>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generates plain text template for admin order notification emails
 * @param {Object} orderData - Order data
 * @returns {string} Plain text template string
 */
export const generateOrderNotificationTextTemplate = (orderData) => {
    const timestamp = formatTimestamp(orderData.orderDate);

    return `
🛒 NEW ORDER RECEIVED - ACTION REQUIRED!

Order #${orderData.orderId}

CUSTOMER INFORMATION:
👤 Name: ${orderData.customerName}
📧 Email: ${orderData.customerEmail}
${orderData.customerPhone ? `📱 Phone: ${orderData.customerPhone}` : ''}

ORDER DETAILS:
${generateOrderItemsText(orderData)}

💰 Total Amount: ₹${orderData.totalAmount}

${generateShippingAddressText(orderData.shippingAddress)}

📅 Order Date: ${timestamp}
🏷️ Status: ${orderData.status || 'Processing'}
💳 Payment Method: ${orderData.paymentMethod || 'Not specified'}
📝 Notes: ${orderData.notes || 'No special instructions'}

⚡ Please process this order as soon as possible!
    `;
};