// checkout.entity.js

export class CheckoutEntity {
    constructor({
        userId,
        items = [],
        shippingAddress = {},
        billingAddress = {},
        paymentMethod = {},
        subtotal = 0,
        shippingCost = 0,
        taxAmount = 0,
        discountAmount = 0,
        totalAmount = 0,
        currency = 'INR',
        status = 'PENDING',
        sessionId = null,
        expiresAt = null,
        createdAt = new Date(),
        updatedAt = new Date()
    }) {
        this.userId = userId;
        this.items = items;
        this.shippingAddress = shippingAddress;
        this.billingAddress = billingAddress;
        this.paymentMethod = paymentMethod;
        this.subtotal = subtotal;
        this.shippingCost = shippingCost;
        this.taxAmount = taxAmount;
        this.discountAmount = discountAmount;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.status = status;
        this.sessionId = sessionId;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Validation methods
    validateItems() {
        if (!this.items || this.items.length === 0) {
            throw new Error('Checkout must contain at least one item');
        }

        this.items.forEach((item, index) => {
            if (item.productId == null || item.quantity == null || item.price === undefined || item.price === null) {
                throw new Error(`Invalid item at index ${index}: product, quantity, and price are required`);
            }
            if (item.quantity <= 0) {
                throw new Error(`Invalid quantity for item at index ${index}`);
            }
            if (item.price <= 0) {
                throw new Error(`Invalid price for item at index ${index}`);
            }
        });
    }

    validateAddresses() {
        if (!this.shippingAddress || Object.keys(this.shippingAddress).length === 0) {
            throw new Error('Shipping address is required');
        }

        const requiredFields = ['fullName', 'phoneNumber', 'addressLine1', 'city', 'state', 'pinCode', 'country'];
        requiredFields.forEach(field => {
            if (!this.shippingAddress[field]) {
                throw new Error(`Shipping address missing required field: ${field}`);
            }
        });

        // Validate pin code format (Indian postal code)
        const pinCodeRegex = /^[1-9][0-9]{5}$/;
        if (!pinCodeRegex.test(this.shippingAddress.pinCode)) {
            throw new Error('Invalid pin code format');
        }

        // Validate phone number format
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(this.shippingAddress.phoneNumber)) {
            throw new Error('Invalid phone number format');
        }
    }

    validateAmounts() {
        if (this.subtotal < 0 || this.shippingCost < 0 || this.taxAmount < 0 || this.discountAmount < 0) {
            throw new Error('Amounts cannot be negative');
        }

        const calculatedTotal = this.subtotal + this.shippingCost + this.taxAmount - this.discountAmount;
        if (Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
            throw new Error('Total amount calculation mismatch');
        }
    }

    validate() {
        this.validateItems();
        this.validateAddresses();
        this.validateAmounts();
        
        if (!this.userId) {
            throw new Error('User ID is required');
        }
    }

    // Calculation methods
    calculateSubtotal() {
        this.subtotal = this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        return this.subtotal;
    }

    calculateShipping() {
        // Basic shipping calculation - can be enhanced based on business logic
        if (this.subtotal >= 500) {
            this.shippingCost = 0; // Free shipping above ₹500
        } else {
            this.shippingCost = 50; // Flat ₹50 shipping
        }
        return this.shippingCost;
    }

    calculateTax(taxRate = 0.18) {
        // GST calculation at 18%
        this.taxAmount = Math.round((this.subtotal + this.shippingCost) * taxRate * 100) / 100;
        return this.taxAmount;
    }

    calculateTotal() {
        this.totalAmount = this.subtotal + this.shippingCost + this.taxAmount - this.discountAmount;
        return this.totalAmount;
    }

    // Utility methods
    isExpired() {
        return this.expiresAt && new Date() > this.expiresAt;
    }

    canBeModified() {
        return this.status === 'PENDING' && !this.isExpired();
    }

    setExpiration(minutes = 30) {
        this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    }

    // Convert to plain object for database storage
    toObject() {
        return {
            userId: this.userId,
            items: this.items,
            shippingAddress: this.shippingAddress,
            billingAddress: this.billingAddress,
            paymentMethod: this.paymentMethod,
            subtotal: this.subtotal,
            shippingCost: this.shippingCost,
            taxAmount: this.taxAmount,
            discountAmount: this.discountAmount,
            totalAmount: this.totalAmount,
            currency: this.currency,
            status: this.status,
            sessionId: this.sessionId,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Static factory method
    static fromObject(data) {
        return new CheckoutEntity(data);
    }
}