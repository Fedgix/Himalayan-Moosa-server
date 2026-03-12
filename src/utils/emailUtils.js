import nodemailer from 'nodemailer';

/**
 * Creates a nodemailer transporter with the given configuration
 * @param {Object} config - SMTP configuration object
 * @returns {Object} Nodemailer transporter instance
 */
export const createTransporter = (config) => {
    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.auth.user,
            pass: config.auth.pass
        }
    });
};

/**
 * Formats timestamp for email display
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted timestamp string
 */
export const formatTimestamp = (timestamp) => {
    return timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();
};

/**
 * Calculates price range from product variants
 * @param {Array} variants - Product variants array
 * @param {number} basePrice - Base price if no variants
 * @returns {Object} Price range object with min and max
 */
export const calculatePriceRange = (variants, basePrice) => {
    if (!variants || variants.length === 0) {
        return { min: basePrice, max: basePrice };
    }
    
    const prices = variants.map(v => v.discountPrice || v.price);
    return {
        min: Math.min(...prices),
        max: Math.max(...prices)
    };
};

/**
 * Formats price display
 * @param {Object} priceRange - Price range object
 * @returns {string} Formatted price string
 */
export const formatPrice = (priceRange) => {
    return priceRange.min === priceRange.max 
        ? `₹${priceRange.min}` 
        : `₹${priceRange.min} - ₹${priceRange.max}`;
};

/**
 * Extracts unique variant values
 * @param {Array} variants - Product variants array
 * @param {string} property - Property to extract (e.g., 'color', 'size')
 * @returns {Array} Array of unique values
 */
export const extractVariantValues = (variants, property) => {
    if (!variants || variants.length === 0) return [];
    return [...new Set(variants.map(v => v[property]).filter(Boolean))];
};

/**
 * Gets primary image URL from product images
 * @param {Array} images - Product images array
 * @param {string} defaultImage - Default image URL
 * @param {string} placeholder - Placeholder image URL
 * @returns {string} Image URL
 */
export const getPrimaryImageUrl = (images, defaultImage, placeholder) => {
    if (images && images.length > 0) {
        const primaryImage = images.find(img => img.isPrimary);
        return primaryImage?.imageUrl || images[0].imageUrl;
    }
    return defaultImage || placeholder;
};

/**
 * Sends email with error handling and result formatting
 * @param {Object} transporter - Nodemailer transporter
 * @param {Object} mailOptions - Email options
 * @param {string} errorContext - Context for error logging
 * @returns {Object} Result object with success status
 */
export const sendEmail = async (transporter, mailOptions, errorContext) => {
    try {
        const result = await transporter.sendMail(mailOptions);
        return {
            success: true,
            message: `${errorContext} sent successfully`,
            messageId: result.messageId
        };
    } catch (error) {
        console.error(`${errorContext} Error:`, error);
        return {
            success: false,
            message: `Failed to send ${errorContext.toLowerCase()}`,
            error: error.message
        };
    }
};

/**
 * Sends bulk emails with rate limiting
 * @param {Object} transporter - Nodemailer transporter
 * @param {Array} emailList - Array of email addresses
 * @param {Function} createMailOptions - Function to create mail options for each email
 * @param {number} delay - Delay between emails in ms
 * @returns {Object} Bulk send result
 */
export const sendBulkEmails = async (transporter, emailList, createMailOptions, delay = 500) => {
    const results = [];
    
    for (const email of emailList) {
        const mailOptions = createMailOptions(email);
        
        try {
            const result = await transporter.sendMail(mailOptions);
            results.push({
                email,
                success: true,
                messageId: result.messageId
            });
        } catch (error) {
            results.push({
                email,
                success: false,
                error: error.message
            });
        }
        
        // Add delay to avoid rate limiting
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    const successful = results.filter(r => r.success).length;
    
    return {
        success: successful > 0,
        message: `Emails sent to ${successful}/${emailList.length} recipients`,
        results
    };
};

/**
 * Validates email configuration
 * @param {Object} transporter - Nodemailer transporter
 * @returns {Object} Validation result
 */
export const validateEmailConfig = async (transporter) => {
    try {
        await transporter.verify();
        return {
            success: true,
            message: 'Email service connection successful'
        };
    } catch (error) {
        console.error('Email Service Connection Error:', error);
        return {
            success: false,
            message: 'Email service connection failed',
            error: error.message
        };
    }
};