// order.entity.js

export default class OrderEntity {
    constructor({
        id,
        userId,
        orderNumber,
        items = [],
        shippingAddress,
        billingAddress,
        subtotal,
        shippingFee = 0,
        tax = 0,
        discount = 0,
        totalAmount,
        paymentStatus = 'pending',
        orderStatus = 'pending',
        paymentMethod = 'razorpay',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        notes,
        createdAt,
        updatedAt
    }) {
        this.id = id;
        this.userId = userId;
        this.orderNumber = orderNumber;
        this.items = items;
        this.shippingAddress = shippingAddress;
        this.billingAddress = billingAddress;
        this.subtotal = subtotal;
        this.shippingFee = shippingFee;
        this.tax = tax;
        this.discount = discount;
        this.totalAmount = totalAmount;
        this.paymentStatus = paymentStatus;
        this.orderStatus = orderStatus;
        this.paymentMethod = paymentMethod;
        this.razorpayOrderId = razorpayOrderId;
        this.razorpayPaymentId = razorpayPaymentId;
        this.razorpaySignature = razorpaySignature;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromDocument(doc) {
        return new OrderEntity({
            id: doc._id?.toString(),
            userId: doc.userId?.toString(),
            orderNumber: doc.orderNumber,
            items: doc.items || [],
            shippingAddress: doc.shippingAddress,
            billingAddress: doc.billingAddress,
            subtotal: doc.subtotal,
            shippingFee: doc.shippingFee,
            tax: doc.tax,
            discount: doc.discount,
            totalAmount: doc.totalAmount,
            paymentStatus: doc.paymentStatus,
            orderStatus: doc.orderStatus,
            paymentMethod: doc.paymentMethod,
            razorpayOrderId: doc.razorpayOrderId,
            razorpayPaymentId: doc.razorpayPaymentId,
            razorpaySignature: doc.razorpaySignature,
            notes: doc.notes,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        });
    }

    toDocument() {
        const doc = {
            userId: this.userId,
            orderNumber: this.orderNumber,
            items: this.items,
            shippingAddress: this.shippingAddress,
            billingAddress: this.billingAddress,
            subtotal: this.subtotal,
            shippingFee: this.shippingFee,
            tax: this.tax,
            discount: this.discount,
            totalAmount: this.totalAmount,
            paymentStatus: this.paymentStatus,
            orderStatus: this.orderStatus,
            paymentMethod: this.paymentMethod,
            razorpayOrderId: this.razorpayOrderId,
            razorpayPaymentId: this.razorpayPaymentId,
            razorpaySignature: this.razorpaySignature,
            notes: this.notes
        };

        if (this.id) {
            doc._id = this.id;
        }

        return doc;
    }

    generateOrderNumber() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        this.orderNumber = `RZ${timestamp}${random}`;
        return this.orderNumber;
    }

    calculateTotals() {
        this.subtotal = this.items.reduce((sum, item) => {
            const price = item.discountPrice || item.price;
            return sum + (price * item.quantity);
        }, 0);

        this.totalAmount = this.subtotal + this.shippingFee + this.tax - this.discount;
        return this.totalAmount;
    }

    isValid() {
        return !!(
            this.userId &&
            this.items && this.items.length > 0 &&
            this.shippingAddress &&
            this.subtotal >= 0 &&
            this.totalAmount > 0
        );
    }
}