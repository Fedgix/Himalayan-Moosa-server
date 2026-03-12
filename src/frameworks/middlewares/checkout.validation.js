import CustomError from "../../utils/custom.error.js"; 

// Validate checkout initialization input
export const validateCheckoutInput = (req, res, next) => {
    try {
        const { items, shippingAddressId } = req.body;
        
        // Validate items array
        if (!items || !Array.isArray(items)) {
            throw new CustomError('Items must be provided as an array', 400, true);
        }

        if (items.length === 0) {
            throw new CustomError('At least one item is required', 400, true);
        }

        if (items.length > 20) {
            throw new CustomError('Maximum 20 items allowed per checkout', 400, true);
        }

        // Validate each item
        items.forEach((item, index) => {
            if (!item.productId) {
                throw new CustomError(`Item at index ${index}: productId is required`, 400, true);
            }

            if (!item.variantId) {
                throw new CustomError(`Item at index ${index}: variantId is required`, 400, true);
            }

            if (!item.quantity || typeof item.quantity !== 'number') {
                throw new CustomError(`Item at index ${index}: quantity must be a valid number`, 400, true);
            }

            if (item.quantity <= 0) {
                throw new CustomError(`Item at index ${index}: quantity must be greater than 0`, 400, true);
            }

            if (item.quantity > 10) {
                throw new CustomError(`Item at index ${index}: maximum quantity per item is 10`, 400, true);
            }

            // Validate MongoDB ObjectId format
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!objectIdRegex.test(item.productId)) {
                throw new CustomError(`Item at index ${index}: invalid productId format`, 400, true);
            }

            if (!objectIdRegex.test(item.variantId)) {
                throw new CustomError(`Item at index ${index}: invalid variantId format`, 400, true);
            }
        });

        // Validate shipping address ID if provided
        if (shippingAddressId) {
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!objectIdRegex.test(shippingAddressId)) {
                throw new CustomError('Invalid shipping address ID format', 400, true);
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Validate payment input
export const validatePaymentInput = (req, res, next) => {
    try {
        const { type, provider, paymentId, orderId } = req.body;

        // Validate payment type
        if (!type) {
            throw new CustomError('Payment method type is required', 400, true);
        }

        const validPaymentTypes = ['RAZORPAY', 'COD', 'UPI', 'CARD'];
        if (!validPaymentTypes.includes(type)) {
            throw new CustomError(`Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}`, 400, true);
        }

        // Validate required fields based on payment type
        switch (type) {
            case 'RAZORPAY':
                if (!paymentId) {
                    throw new CustomError('Payment ID is required for Razorpay payments', 400, true);
                }
                if (!orderId) {
                    throw new CustomError('Order ID is required for Razorpay payments', 400, true);
                }
                break;

            case 'UPI':
                if (!paymentId) {
                    throw new CustomError('Payment ID is required for UPI payments', 400, true);
                }
                break;

            case 'CARD':
                if (!paymentId) {
                    throw new CustomError('Payment ID is required for card payments', 400, true);
                }
                break;

            case 'COD':
                // No additional validation required for COD
                break;
        }

        // Validate provider if provided
        if (provider && typeof provider !== 'string') {
            throw new CustomError('Provider must be a string', 400, true);
        }

        // Validate payment ID format if provided
        if (paymentId && typeof paymentId !== 'string') {
            throw new CustomError('Payment ID must be a string', 400, true);
        }

        // Validate order ID format if provided
        if (orderId && typeof orderId !== 'string') {
            throw new CustomError('Order ID must be a string', 400, true);
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Validate address input
export const validateAddressInput = (req, res, next) => {
    try {
        const {
            fullName,
            phoneNumber,
            addressLine1,
            addressLine2,
            landmark,
            city,
            state,
            pinCode,
            country
        } = req.body;

        // Required fields validation
        const requiredFields = {
            fullName: 'Full name is required',
            phoneNumber: 'Phone number is required',
            addressLine1: 'Address line 1 is required',
            city: 'City is required',
            state: 'State is required',
            pinCode: 'Pin code is required',
            country: 'Country is required'
        };

        for (const [field, message] of Object.entries(requiredFields)) {
            if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
                throw new CustomError(message, 400, true);
            }
        }

        // Validate field lengths
        if (fullName.length > 100) {
            throw new CustomError('Full name cannot exceed 100 characters', 400, true);
        }

        if (addressLine1.length > 255) {
            throw new CustomError('Address line 1 cannot exceed 255 characters', 400, true);
        }

        if (addressLine2 && addressLine2.length > 255) {
            throw new CustomError('Address line 2 cannot exceed 255 characters', 400, true);
        }

        if (landmark && landmark.length > 100) {
            throw new CustomError('Landmark cannot exceed 100 characters', 400, true);
        }

        if (city.length > 100) {
            throw new CustomError('City cannot exceed 100 characters', 400, true);
        }

        if (state.length > 100) {
            throw new CustomError('State cannot exceed 100 characters', 400, true);
        }

        // Validate phone number format (Indian mobile number)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            throw new CustomError('Please provide a valid Indian phone number (10 digits starting with 6-9)', 400, true);
        }

        // Validate pin code format (Indian postal code)
        const pinCodeRegex = /^[1-9][0-9]{5}$/;
        if (!pinCodeRegex.test(pinCode)) {
            throw new CustomError('Please provide a valid Indian pin code (6 digits, cannot start with 0)', 400, true);
        }

        // Validate country (for now, only India is supported)
        if (country.toLowerCase() !== 'india') {
            throw new CustomError('Currently, only India is supported as delivery location', 400, true);
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Validate discount input
export const validateDiscountInput = (req, res, next) => {
    try {
        const { discountCode, discountAmount } = req.body;

        if (!discountCode) {
            throw new CustomError('Discount code is required', 400, true);
        }

        if (typeof discountCode !== 'string') {
            throw new CustomError('Discount code must be a string', 400, true);
        }

        if (discountCode.length < 3 || discountCode.length > 20) {
            throw new CustomError('Discount code must be between 3 and 20 characters', 400, true);
        }

        if (discountAmount === undefined || discountAmount === null) {
            throw new CustomError('Discount amount is required', 400, true);
        }

        if (typeof discountAmount !== 'number') {
            throw new CustomError('Discount amount must be a number', 400, true);
        }

        if (discountAmount < 0) {
            throw new CustomError('Discount amount cannot be negative', 400, true);
        }

        if (discountAmount > 10000) {
            throw new CustomError('Discount amount cannot exceed ₹10,000', 400, true);
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Validate ObjectId parameter
export const validateObjectId = (paramName) => {
    return (req, res, next) => {
        try {
            const id = req.params[paramName];
            
            if (!id) {
                throw new CustomError(`${paramName} is required`, 400, true);
            }

            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!objectIdRegex.test(id)) {
                throw new CustomError(`Invalid ${paramName} format`, 400, true);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Validate quantity input
export const validateQuantityInput = (req, res, next) => {
    try {
        const { quantity } = req.body;

        if (quantity === undefined || quantity === null) {
            throw new CustomError('Quantity is required', 400, true);
        }

        if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
            throw new CustomError('Quantity must be a valid integer', 400, true);
        }

        if (quantity < 0) {
            throw new CustomError('Quantity cannot be negative', 400, true);
        }

        if (quantity > 10) {
            throw new CustomError('Maximum quantity per item is 10', 400, true);
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Validate pagination parameters
export const validatePaginationParams = (req, res, next) => {
    try {
        let { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        // Convert to numbers
        page = parseInt(page);
        limit = parseInt(limit);

        // Validate page
        if (isNaN(page) || page < 1) {
            throw new CustomError('Page must be a positive integer', 400, true);
        }

        // Validate limit
        if (isNaN(limit) || limit < 1 || limit > 100) {
            throw new CustomError('Limit must be between 1 and 100', 400, true);
        }

        // Validate sort
        const validSortFields = ['createdAt', 'updatedAt', 'totalAmount', 'status'];
        const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
        
        if (!validSortFields.includes(sortField)) {
            throw new CustomError(`Invalid sort field. Must be one of: ${validSortFields.join(', ')}`, 400, true);
        }

        // Add validated params to req
        req.pagination = { page, limit, sort };

        next();
    } catch (error) {
        next(error);
    }
};