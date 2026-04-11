import Razorpay from 'razorpay';
import crypto from 'crypto';
import CheckoutSession from '../model/checkout.session.model.js';
import CheckoutRepository from '../repository/checkout.repository.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';
import { config } from '../../../config/env.js';
import mongoose from 'mongoose';
import { cartService } from '../../cart/services/cart.service.js';
import InvoiceService from '../../invoice/services/invoice.service.js';

const razorpay = new Razorpay({
    key_id: config.RAZORPAY.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY.RAZORPAY_KEY_SECRET
});

/** Resolve productId / variantId from a checkout session line (embedded docs). */
function sessionLineIds(item) {
    const pid = item.productId?._id?.toString?.() ?? item.productId?.toString?.() ?? String(item.productId);
    const vid = item.variantId
        ? item.variantId._id?.toString?.() ?? item.variantId.toString?.() ?? String(item.variantId)
        : null;
    return { pid, vid };
}

/**
 * Find line index: with variantId match that variant; without variant, match productId and no variant.
 */
function findCheckoutSessionItemIndex(items, { productId, variantId }) {
    const wantP = productId ? String(productId) : null;
    const wantV = variantId ? String(variantId) : null;
    return items.findIndex((item) => {
        const { pid, vid } = sessionLineIds(item);
        if (wantV) {
            return vid === wantV && (!wantP || pid === wantP);
        }
        return !vid && wantP && pid === wantP;
    });
}

export const CheckoutService = {

    initializeCheckout: async (userId, items, source = 'cart') => {
        try {

            await CheckoutSession.deleteMany({ userId });

            const validatedItems = await CheckoutRepository.validateAndEnrichItems(items);

            const subtotal = validatedItems.reduce((sum, item) => sum + item.itemTotal, 0);
            const totalAmount = subtotal; 

            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); 

            const session = await CheckoutSession.create({
                userId,
                items: validatedItems,
                source,
                subtotal,
                totalAmount,
                expiresAt
            });

            console.log('Session created:', {
                sessionId: session._id,
                userId: session.userId,
                expiresAt: session.expiresAt,
                currentTime: new Date()
            });

            return {
                success: true,
                message: 'Checkout initialized successfully',
                data: {
                    sessionId: session._id,
                    items: validatedItems,
                    totals: {
                        subtotal: session.subtotal,
                        shippingFee: session.shippingFee,
                        tax: session.tax,
                        discount: session.discount,
                        totalAmount: session.totalAmount
                    },
                    summary: {
                        itemCount: validatedItems.length,
                        totalQuantity: validatedItems.reduce((sum, item) => sum + item.quantity, 0),
                        currency: 'INR'
                    }
                }
            };
        } catch (error) {
            console.error('Error initializing checkout:', error);
            throw new CustomError('Failed to initialize checkout', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    findActiveSession: async (userId) => {
        try {
            console.log('findActiveSession - userId:', userId);
            console.log('findActiveSession - userId type:', typeof userId);
            console.log('findActiveSession - current time:', new Date());

            let queryUserId;
            if (typeof userId === 'string') {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    throw new CustomError('Invalid user ID format', HttpStatusCode.BAD_REQUEST, true);
                }
                queryUserId = new mongoose.Types.ObjectId(userId);
            } else if (userId instanceof mongoose.Types.ObjectId) {
                queryUserId = userId;
            } else {
                queryUserId = userId;
            }

            console.log('findActiveSession - queryUserId:', queryUserId);

            const currentTime = new Date();
            console.log('findActiveSession - looking for sessions that expire after:', currentTime);

            const session = await CheckoutSession.findOne({
                userId: queryUserId,
                expiresAt: { $gt: currentTime }
            });

            console.log('findActiveSession - session found:', session ? 'Yes' : 'No');

            if (session) {
                console.log('findActiveSession - session details:', {
                    id: session._id,
                    userId: session.userId,
                    expiresAt: session.expiresAt,
                    expired: session.expiresAt <= currentTime,
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                });

                if (session.expiresAt <= currentTime) {
                    console.log('findActiveSession - session is expired, removing it');
                    await CheckoutSession.deleteOne({ _id: session._id });
                    throw new CustomError('Checkout session expired', HttpStatusCode.GONE, true);
                }

                return session;
            }

            const expiredSessions = await CheckoutSession.find({
                userId: queryUserId,
                expiresAt: { $lte: currentTime }
            });

            if (expiredSessions.length > 0) {
                console.log('findActiveSession - found expired sessions, cleaning up:', expiredSessions.length);
                await CheckoutSession.deleteMany({
                    userId: queryUserId,
                    expiresAt: { $lte: currentTime }
                });
                throw new CustomError('Checkout session expired', HttpStatusCode.GONE, true);
            }

            throw new CustomError('No active checkout session found', HttpStatusCode.NOT_FOUND, true);

        } catch (error) {
            console.error('Error in findActiveSession:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to find checkout session', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    applyShippingAddress: async (userId, addressId) => {
        try {
            console.log('applyShippingAddress called with:', { userId, addressId });

            const session = await CheckoutService.findActiveSession(userId);
            console.log('Found session:', session._id);

            const shippingAddress = await CheckoutRepository.getAddressByUserIdAndAddressId(userId, addressId);
            console.log('Found shipping address:', shippingAddress ? 'Yes' : 'No');

            if (!shippingAddress) {
                throw new CustomError('Shipping address not found', HttpStatusCode.NOT_FOUND, true);
            }

            const shippingFee = await CheckoutRepository.calculateShippingFee(session.items, shippingAddress);
            const tax = await CheckoutRepository.calculateTax(session.items, shippingAddress);
            const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

            console.log('Calculated fees:', { shippingFee, tax });

            const updatedSession = await CheckoutSession.findOneAndUpdate(
                {
                    _id: session._id,
                    userId: userId,
                    expiresAt: { $gt: new Date() } 
                },
                {
                    shippingAddress: shippingAddress,
                    shippingFee: shippingFee,
                    tax: tax,
                    totalAmount: session.subtotal + shippingFee + tax - session.discount,
                    expiresAt: newExpiresAt
                },
                {
                    new: true,
                    runValidators: true,
                    upsert: false 
                }
            );

            if (!updatedSession) {
                console.error('Failed to update session - session may have expired or been deleted');
                throw new CustomError('Checkout session expired or invalid', HttpStatusCode.GONE, true);
            }

            console.log('Successfully updated session with shipping address');

            return {
                success: true,
                message: 'Shipping address applied successfully',
                data: {
                    shippingAddress,
                    totals: {
                        subtotal: updatedSession.subtotal,
                        shippingFee: updatedSession.shippingFee,
                        tax: updatedSession.tax,
                        discount: updatedSession.discount,
                        totalAmount: updatedSession.totalAmount
                    }
                }
            };
        } catch (error) {
            console.error('Error applying shipping address:', error);

            if (error instanceof CustomError) {
                throw error;
            }

            if (error.name === 'CastError') {
                throw new CustomError('Invalid session or address ID', HttpStatusCode.BAD_REQUEST, true);
            }

            if (error.name === 'ValidationError') {
                throw new CustomError('Invalid data provided', HttpStatusCode.BAD_REQUEST, true);
            }

            throw new CustomError('Failed to apply shipping address', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    updateCheckoutItem: async (userId, { variantId, productId, quantity }) => {
        try {
            const session = await CheckoutService.findActiveSession(userId);

            const itemIndex = findCheckoutSessionItemIndex(session.items, { productId, variantId });
            if (itemIndex === -1) {
                throw new CustomError('Item not found in checkout session', HttpStatusCode.NOT_FOUND, true);
            }

            const item = session.items[itemIndex];
            const { pid, vid } = sessionLineIds(item);
            const stockKey = vid || pid;
            const stockCheck = await CheckoutRepository.checkStockAvailability(stockKey, quantity);
            if (!stockCheck.available) {
                throw new CustomError(`Only ${stockCheck.availableStock} items available`, HttpStatusCode.BAD_REQUEST, true);
            }
            item.quantity = quantity;
            item.itemTotal = (item.discountPrice || item.price) * quantity;

            session.subtotal = session.items.reduce((sum, item) => sum + item.itemTotal, 0);
            session.totalAmount = session.subtotal + session.shippingFee + session.tax - session.discount;
            const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

            const updatedSession = await CheckoutSession.findOneAndUpdate(
                { _id: session._id, userId: userId },
                {
                    items: session.items,
                    subtotal: session.subtotal,
                    totalAmount: session.totalAmount,
                    expiresAt: newExpiresAt
                },
                { new: true, runValidators: true }
            );

            if (!updatedSession) {
                throw new CustomError('Failed to update checkout session', HttpStatusCode.INTERNAL_SERVER, true);
            }

            return {
                success: true,
                message: 'Item updated successfully',
                data: {
                    updatedItem: item,
                    totals: {
                        subtotal: updatedSession.subtotal,
                        shippingFee: updatedSession.shippingFee,
                        tax: updatedSession.tax,
                        discount: updatedSession.discount,
                        totalAmount: updatedSession.totalAmount
                    }
                }
            };
        } catch (error) {
            console.error('Error updating checkout item:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update checkout item', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    createRazorpayOrder: async (orderAmount, orderData) => {
        try {
            console.log('Creating Razorpay order with data:', {
                orderAmount,
                orderData: {
                    userId: orderData.userId,
                    orderId: orderData.orderId,
                    itemsLength: orderData.items ? orderData.items.length : 'undefined'
                }
            });

            if (!orderAmount || orderAmount <= 0) {
                throw new CustomError('Invalid order amount provided', HttpStatusCode.BAD_REQUEST, true);
            }

            if (!orderData.userId) {
                throw new CustomError('User ID is required for payment', HttpStatusCode.BAD_REQUEST, true);
            }

            const receiptId = `${orderData.userId}_${Date.now()}`;
            const amountInPaise = Math.round(orderAmount * 100);

            if (isNaN(amountInPaise) || amountInPaise <= 0) {
                throw new CustomError('Invalid amount calculation', HttpStatusCode.BAD_REQUEST, true);
            }

            const options = {
                amount: amountInPaise,
                currency: 'INR',
                receipt: receiptId,
                payment_capture: 1,
                notes: {
                    userId: orderData.userId.toString(),
                    itemCount: orderData.items ? orderData.items.length : 0,
                    orderType: 'ecommerce',
                    ...(orderData.orderId && { orderId: orderData.orderId.toString() })
                }
            };

            console.log('Razorpay order options:', options);

            const razorpayOrder = await razorpay.orders.create(options);
            console.log('Razorpay order created successfully:', razorpayOrder.id);
            return razorpayOrder;
        } catch (error) {
            console.error('Razorpay order creation failed:', error);

            if (error instanceof CustomError) {
                throw error;
            }

            if (error.statusCode) {
                throw new CustomError(
                    `Razorpay error: ${error.error?.description || error.message}`,
                    HttpStatusCode.BAD_REQUEST,
                    true
                );
            }

            throw new CustomError('Failed to create payment order', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    getCurrentSession: async (userId) => {
        try {
            const session = await CheckoutService.findActiveSession(userId);

            return {
                success: true,
                message: 'Session retrieved successfully',
                data: {
                    sessionId: session._id,
                    items: session.items,
                    shippingAddress: session.shippingAddress,
                    totals: {
                        subtotal: session.subtotal,
                        shippingFee: session.shippingFee,
                        tax: session.tax,
                        discount: session.discount,
                        totalAmount: session.totalAmount
                    },
                    expiresAt: session.expiresAt
                }
            };
        } catch (error) {
            console.error('Error getting current session:', error);

            if (error instanceof CustomError && (error.statusCode === 404 || error.statusCode === 410)) {
                return {
                    success: false,
                    message: error.message,
                    data: null
                };
            }
            throw new CustomError('Failed to retrieve session', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    cleanupExpiredSessions: async () => {
        try {
            const currentTime = new Date();
            const result = await CheckoutSession.deleteMany({
                expiresAt: { $lt: currentTime }
            });
            console.log(`Cleaned up ${result.deletedCount} expired sessions at ${currentTime}`);
            return result;
        } catch (error) {
            console.error('Error cleaning up expired sessions:', error);
            throw new CustomError('Failed to cleanup expired sessions', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    createOrder: async (userId, orderOptions = {}) => {
        try {
            console.log('Creating order for user:', userId);

            const session = await CheckoutService.findActiveSession(userId);

            // Apply shipping address if addressId is provided
            if (orderOptions.addressId) {
                console.log('Applying shipping address:', orderOptions.addressId);
                
                const shippingAddress = await CheckoutRepository.getAddressByUserIdAndAddressId(userId, orderOptions.addressId);
                console.log('Found shipping address:', shippingAddress ? 'Yes' : 'No');

                if (!shippingAddress) {
                    throw new CustomError('Shipping address not found', HttpStatusCode.NOT_FOUND, true);
                }

                const shippingFee = await CheckoutRepository.calculateShippingFee(session.items, shippingAddress);
                const tax = await CheckoutRepository.calculateTax(session.items, shippingAddress);
                const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

                console.log('Calculated fees:', { shippingFee, tax });

                const updatedSession = await CheckoutSession.findOneAndUpdate(
                    {
                        _id: session._id,
                        userId: userId,
                        expiresAt: { $gt: new Date() } 
                    },
                    {
                        shippingAddress: shippingAddress,
                        shippingFee: shippingFee,
                        tax: tax,
                        totalAmount: session.subtotal + shippingFee + tax - session.discount,
                        expiresAt: newExpiresAt
                    },
                    {
                        new: true,
                        runValidators: true,
                        upsert: false 
                    }
                );

                if (!updatedSession) {
                    console.error('Failed to update session - session may have expired or been deleted');
                    throw new CustomError('Checkout session expired or invalid', HttpStatusCode.GONE, true);
                }

                console.log('Successfully updated session with shipping address');
                session.shippingAddress = updatedSession.shippingAddress;
                session.shippingFee = updatedSession.shippingFee;
                session.tax = updatedSession.tax;
                session.totalAmount = updatedSession.totalAmount;
            }

            if (!session.shippingAddress) {
                throw new CustomError('Shipping address is required', HttpStatusCode.BAD_REQUEST, true);
            }

            for (const item of session.items) {
                const { pid, vid } = sessionLineIds(item);
                const stockKey = vid || pid;
                const stockCheck = await CheckoutRepository.checkStockAvailability(stockKey, item.quantity);
                if (!stockCheck.available) {
                    throw new CustomError(
                        `Insufficient stock for ${item.productName} (${item.color}, ${item.size}). Available: ${stockCheck.availableStock}`,
                        HttpStatusCode.BAD_REQUEST,
                        true
                    );
                }
            }

            const orderData = {
                userId: userId,
                items: session.items,
                shippingAddress: session.shippingAddress,
                billingAddress: session.shippingAddress, 
                subtotal: session.subtotal,
                shippingFee: session.shippingFee,
                tax: session.tax,
                discount: session.discount,
                totalAmount: session.totalAmount,
                paymentMethod: orderOptions.paymentMethod || 'razorpay',
                paymentStatus: 'pending',
                orderStatus: 'pending',
                notes: orderOptions.notes || null
            };

            console.log('Order data prepared:', {
                userId: orderData.userId,
                itemsCount: orderData.items.length,
                totalAmount: orderData.totalAmount
            });

            const order = await CheckoutRepository.createOrder(orderData);

            console.log('Order created in database:', {
                orderId: order.id || order._id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                totalAmount: order.totalAmount,
                itemsCount: order.items ? order.items.length : 'undefined',
                fullOrder: order 
            });

            if (!order) {
                throw new CustomError('Failed to create order in database', HttpStatusCode.INTERNAL_SERVER, true);
            }

            const orderId = order.id || order._id;
            const orderAmount = order.totalAmount || session.totalAmount;
            const orderUserId = order.userId || userId;

            if (!orderId) {
                throw new CustomError('Order ID is missing after creation', HttpStatusCode.INTERNAL_SERVER, true);
            }

            if (!orderAmount || orderAmount <= 0) {
                throw new CustomError('Invalid order amount', HttpStatusCode.BAD_REQUEST, true);
            }

            console.log('Using values for Razorpay:', {
                orderId,
                orderAmount,
                orderUserId
            });

            const razorpayOrderData = {
                userId: orderUserId,
                orderId: orderId,
                items: session.items 
            };

            const razorpayOrder = await CheckoutService.createRazorpayOrder(orderAmount, razorpayOrderData);

            await CheckoutRepository.updateOrderRazorpayId(orderId, razorpayOrder.id);

            await CheckoutSession.findOneAndUpdate(
                { _id: session._id },
                {
                    orderId: orderId,
                    razorpayOrderId: razorpayOrder.id,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000) 
                }
            );

            console.log('Order created successfully:', orderId);

            return {
                success: true,
                message: 'Order created successfully',
                data: {
                    orderId: orderId,
                    orderNumber: order.orderNumber || `ORDER_${orderId}`,
                    totalAmount: orderAmount,
                    razorpayOrder: {
                        id: razorpayOrder.id,
                        currency: razorpayOrder.currency,
                        amount: razorpayOrder.amount
                    },

                    paymentConfig: {
                        key: config.RAZORPAY.RAZORPAY_KEY_ID,
                        amount: razorpayOrder.amount,
                        currency: razorpayOrder.currency,
                        order_id: razorpayOrder.id,
                        name: "Rizo", 
                        description: `Order ${order.orderNumber || orderId}`,
                        prefill: {
                            name: session.shippingAddress.fullName,
                            email: "rizo.ind.in@gmail.com", 
                            contact: session.shippingAddress.phoneNumber
                        },
                        theme: {
                            color: "#3399cc"
                        },
                        modal: {
                            ondismiss: function () {

                            }
                        }
                    }
                }
            };

        } catch (error) {
            console.error('Error creating order:', error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError('Failed to create order', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    // verifyRazorpayPayment: async (userId, paymentData) => {
    //     try {
    //         console.log('Verifying Razorpay payment:', paymentData);

    //         const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    //         const order = await CheckoutRepository.getOrderById(orderId);
    //         console.log("Order: ", order)
    //         console.log("UserID: ", userId)

    //         const orderUserId = order.userId.toString();
    //         const requestUserId = userId.toString();

    //         console.log("Order UserID (string):", orderUserId);
    //         console.log("Request UserID (string):", requestUserId);

    //         if (orderUserId !== requestUserId) {
    //             throw new CustomError('Order does not belong to user', HttpStatusCode.FORBIDDEN, true);
    //         }

    //         if (order.razorpayOrderId !== razorpay_order_id) {
    //             throw new CustomError('Razorpay order ID mismatch', HttpStatusCode.BAD_REQUEST, true);
    //         }

    //         const expectedSignature = crypto
    //             .createHmac('sha256', config.RAZORPAY.RAZORPAY_KEY_SECRET)
    //             .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    //             .digest('hex');

    //         if (expectedSignature !== razorpay_signature) {
    //             await CheckoutRepository.updateOrderPaymentStatus(orderId, {
    //                 paymentStatus: 'failed',
    //                 orderStatus: 'cancelled',
    //                 razorpayPaymentId: razorpay_payment_id,
    //                 razorpaySignature: razorpay_signature
    //             });

    //             throw new CustomError('Payment verification failed', HttpStatusCode.BAD_REQUEST, true);
    //         }

    //         const updatedOrder = await CheckoutRepository.updateOrderPaymentStatus(orderId, {
    //             paymentStatus: 'paid',
    //             orderStatus: 'confirmed',
    //             razorpayPaymentId: razorpay_payment_id,
    //             razorpaySignature: razorpay_signature
    //         });

    //         const checkoutSession = await CheckoutSession.findOne({ userId, orderId });

    //         if (checkoutSession && checkoutSession.source === 'cart') {
    //             try {
    //                 console.log('Clearing cart items after successful payment from cart source');

    //                 const variantIds = order.items.map(item => item.variantId);

    //                 await CheckoutService.clearCartItemsAfterPayment(userId, variantIds);

    //                 console.log('Successfully cleared cart items after payment');
    //             } catch (cartError) {
    //                 console.error('Error clearing cart items after payment:', cartError);
    //             }
    //         }

    //         await CheckoutSession.deleteOne({ userId, orderId });

    //         console.log('Payment verified successfully for order:', orderId);

    //         return {
    //             success: true,
    //             message: 'Payment verified successfully',
    //             data: {
    //                 orderId: updatedOrder.id,
    //                 orderNumber: updatedOrder.orderNumber,
    //                 paymentStatus: updatedOrder.paymentStatus,
    //                 orderStatus: updatedOrder.orderStatus,
    //                 totalAmount: updatedOrder.totalAmount,
    //                 razorpayPaymentId: updatedOrder.razorpayPaymentId,
    //                 cartCleared: checkoutSession?.source === 'cart' 
    //             }
    //         };

    //     } catch (error) {
    //         console.error('Error verifying payment:', error);

    //         if (error instanceof CustomError) {
    //             throw error;
    //         }

    //         throw new CustomError('Payment verification failed', HttpStatusCode.INTERNAL_SERVER, true);
    //     }
    // },

    verifyRazorpayPayment: async (userId, paymentData) => {
        try {
            console.log('Verifying Razorpay payment:', paymentData);

            const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

            const order = await CheckoutRepository.getOrderById(orderId);
            console.log("Order: ", order)
            console.log("UserID: ", userId)

            const orderUserId = order.userId.toString();
            const requestUserId = userId.toString();

            console.log("Order UserID (string):", orderUserId);
            console.log("Request UserID (string):", requestUserId);

            if (orderUserId !== requestUserId) {
                throw new CustomError('Order does not belong to user', HttpStatusCode.FORBIDDEN, true);
            }

            if (order.razorpayOrderId !== razorpay_order_id) {
                throw new CustomError('Razorpay order ID mismatch', HttpStatusCode.BAD_REQUEST, true);
            }

            const expectedSignature = crypto
                .createHmac('sha256', config.RAZORPAY.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                await CheckoutRepository.updateOrderPaymentStatus(orderId, {
                    paymentStatus: 'failed',
                    orderStatus: 'cancelled',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature
                });

                throw new CustomError('Payment verification failed', HttpStatusCode.BAD_REQUEST, true);
            }

            const updatedOrder = await CheckoutRepository.updateOrderPaymentStatus(orderId, {
                paymentStatus: 'paid',
                orderStatus: 'confirmed',
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            });

            // Generate invoice after successful payment
            let invoiceData = null;
            try {
                const invoiceResult = await InvoiceService.generateInvoice(orderId);
                invoiceData = invoiceResult.data;
                console.log('Invoice generated successfully for order:', orderId);
            } catch (invoiceError) {
                console.error('Error generating invoice:', invoiceError);
                // Don't fail the payment verification if invoice generation fails
            }

            const checkoutSession = await CheckoutSession.findOne({ userId, orderId });

            if (checkoutSession && checkoutSession.source === 'cart') {
                try {
                    console.log('Clearing cart items after successful payment from cart source');

                    await CheckoutService.clearCartItemsAfterPayment(userId, order.items);

                    console.log('Successfully cleared cart items after payment');
                } catch (cartError) {
                    console.error('Error clearing cart items after payment:', cartError);
                }
            }

            await CheckoutSession.deleteOne({ userId, orderId });

            console.log('Payment verified successfully for order:', orderId);

            return {
                success: true,
                message: 'Payment verified successfully',
                data: {
                    orderId: updatedOrder.id,
                    orderNumber: updatedOrder.orderNumber,
                    paymentStatus: updatedOrder.paymentStatus,
                    orderStatus: updatedOrder.orderStatus,
                    totalAmount: updatedOrder.totalAmount,
                    razorpayPaymentId: updatedOrder.razorpayPaymentId,
                    cartCleared: checkoutSession?.source === 'cart',
                    invoice: invoiceData // Include invoice data in response
                }
            };

        } catch (error) {
            console.error('Error verifying payment:', error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError('Payment verification failed', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },


    handlePaymentFailure: async (userId, failureData) => {
        try {
            console.log('Handling payment failure:', failureData);

            const { orderId, razorpay_order_id, error } = failureData;

            const order = await CheckoutRepository.getOrderById(orderId);
            console.log("Order: ", order)
            console.log("UserID: ", userId)

            const orderUserId = order.userId.toString();
            const requestUserId = userId.toString();

            console.log("Order UserID (string):", orderUserId);
            console.log("Request UserID (string):", requestUserId);

            if (orderUserId !== requestUserId) {
                throw new CustomError('Order does not belong to user', HttpStatusCode.FORBIDDEN, true);
            }

            if (order.razorpayOrderId !== razorpay_order_id) {
                throw new CustomError('Razorpay order ID mismatch', HttpStatusCode.BAD_REQUEST, true);
            }

            const updatedOrder = await CheckoutRepository.updateOrderPaymentStatus(orderId, {
                paymentStatus: 'failed',
                orderStatus: 'cancelled',
                notes: error ? `Payment failed: ${error.description || error.reason || 'Unknown error'}` : 'Payment failed'
            });

            await CheckoutSession.findOneAndUpdate(
                { userId, orderId },
                {
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000) 
                }
            );

            console.log('Payment failure handled for order:', orderId);

            return {
                success: true,
                message: 'Payment failure recorded',
                data: {
                    orderId: updatedOrder.id,
                    orderNumber: updatedOrder.orderNumber,
                    paymentStatus: updatedOrder.paymentStatus,
                    orderStatus: updatedOrder.orderStatus,
                    canRetry: true, 
                    retryMessage: 'You can retry payment for this order'
                }
            };

        } catch (error) {
            console.error('Error handling payment failure:', error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError('Failed to handle payment failure', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    removeCheckoutItem: async (userId, { variantId, productId }) => {
        try {
            const session = await CheckoutService.findActiveSession(userId);

            const itemIndex = findCheckoutSessionItemIndex(session.items, { productId, variantId });
            if (itemIndex === -1) {
                throw new CustomError('Item not found in checkout session', HttpStatusCode.NOT_FOUND, true);
            }

            session.items.splice(itemIndex, 1);

            if (session.items.length === 0) {
                await CheckoutSession.deleteOne({ _id: session._id });
                return {
                    success: true,
                    message: 'Item removed and session cleared',
                    data: {
                        itemsRemaining: 0,
                        sessionCleared: true
                    }
                };
            }

            session.subtotal = session.items.reduce((sum, item) => sum + item.itemTotal, 0);

            if (session.shippingAddress) {
                session.shippingFee = await CheckoutRepository.calculateShippingFee(session.items, session.shippingAddress);
                session.tax = await CheckoutRepository.calculateTax(session.items, session.shippingAddress);
            }

            session.totalAmount = session.subtotal + session.shippingFee + session.tax - session.discount;
            const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

            const updatedSession = await CheckoutSession.findOneAndUpdate(
                { _id: session._id, userId: userId },
                {
                    items: session.items,
                    subtotal: session.subtotal,
                    shippingFee: session.shippingFee,
                    tax: session.tax,
                    totalAmount: session.totalAmount,
                    expiresAt: newExpiresAt
                },
                { new: true, runValidators: true }
            );

            if (!updatedSession) {
                throw new CustomError('Failed to update checkout session', HttpStatusCode.INTERNAL_SERVER, true);
            }

            return {
                success: true,
                message: 'Item removed successfully',
                data: {
                    itemsRemaining: updatedSession.items.length,
                    totals: {
                        subtotal: updatedSession.subtotal,
                        shippingFee: updatedSession.shippingFee,
                        tax: updatedSession.tax,
                        discount: updatedSession.discount,
                        totalAmount: updatedSession.totalAmount
                    }
                }
            };
        } catch (error) {
            console.error('Error removing checkout item:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to remove checkout item', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    clearCartItemsAfterPayment: async (userId, orderItems) => {
        try {
            if (!orderItems?.length) {
                return { success: true, itemsRemoved: 0, removedItems: [] };
            }

            console.log('Clearing cart items after payment for order lines:', orderItems.length);

            const userCart = await cartService.getUserCart({ userId });

            const cartItemsToRemove = userCart.items.filter((cartItem) => {
                const cpid =
                    cartItem.productId?._id?.toString?.() ??
                    cartItem.productId?.toString?.() ??
                    String(cartItem.productId);
                const cvid = cartItem.variantId
                    ? cartItem.variantId._id?.toString?.() ??
                      cartItem.variantId.toString?.() ??
                      String(cartItem.variantId)
                    : null;

                return orderItems.some((orderItem) => {
                    const opid = orderItem.productId?._id?.toString?.() ?? orderItem.productId?.toString?.();
                    const ovid = orderItem.variantId
                        ? orderItem.variantId._id?.toString?.() ?? orderItem.variantId?.toString?.()
                        : null;
                    if (ovid) {
                        return cvid === ovid && cpid === opid;
                    }
                    return !cvid && cpid === opid;
                });
            });

            for (const cartItem of cartItemsToRemove) {
                await cartService.removeCartItem(cartItem._id, { userId });
                console.log(`Removed cart item ${cartItem._id}`);
            }

            console.log(`Successfully removed ${cartItemsToRemove.length} items from cart`);

            return {
                success: true,
                itemsRemoved: cartItemsToRemove.length,
                removedItems: cartItemsToRemove.map((item) => ({
                    cartItemId: item._id,
                    variantId: item.variantId?._id ?? item.variantId,
                    productName: item.productId?.name,
                    quantity: item.quantity
                }))
            };

        } catch (error) {
            console.error('Error clearing cart items after payment:', error);
            throw error;
        }
    },


    // getOrderById: async (userId, orderId) => {
    //     try {
    //         console.log('Getting order by ID:', { userId, orderId });
    
    //         if (!mongoose.Types.ObjectId.isValid(orderId)) {
    //             throw new CustomError('Invalid order ID format', HttpStatusCode.BAD_REQUEST, true);
    //         }
    
    //         const order = await CheckoutRepository.getOrderById(orderId);
            
    //         // Verify the order belongs to the user
    //         const orderUserId = order.userId.toString();
    //         const requestUserId = userId.toString();
    
    //         if (orderUserId !== requestUserId) {
    //             throw new CustomError('Order not found or does not belong to user', HttpStatusCode.FORBIDDEN, true);
    //         }
    
    //         // Format items to include image
    //         const formattedItems = order.items.map(item => ({
    //             productId: item.productId,
    //             variantId: item.variantId,
    //             productName: item.productName,
    //             productDescription: item.productDescription,
    //             color: item.color,
    //             colorCode: item.colorCode,
    //             size: item.size,
    //             sku: item.sku,
    //             price: item.price,
    //             discountPrice: item.discountPrice,
    //             quantity: item.quantity,
    //             itemTotal: item.itemTotal,
    //             image: item.image, // Include product image
    //             category: item.category,
    //             gender: item.gender
    //         }));
    
    //         return {
    //             success: true,
    //             message: 'Order retrieved successfully',
    //             data: {
    //                 orderId: order.id,
    //                 orderNumber: order.orderNumber,
    //                 items: formattedItems, // Use formatted items with images
    //                 shippingAddress: order.shippingAddress,
    //                 billingAddress: order.billingAddress,
    //                 totals: {
    //                     subtotal: order.subtotal,
    //                     shippingFee: order.shippingFee,
    //                     tax: order.tax,
    //                     discount: order.discount,
    //                     totalAmount: order.totalAmount
    //                 },
    //                 paymentStatus: order.paymentStatus,
    //                 orderStatus: order.orderStatus,
    //                 paymentMethod: order.paymentMethod,
    //                 razorpayOrderId: order.razorpayOrderId,
    //                 razorpayPaymentId: order.razorpayPaymentId,
    //                 notes: order.notes,
    //                 createdAt: order.createdAt,
    //                 updatedAt: order.updatedAt,
    //                 cancelledAt: order.cancelledAt,
    //                 deliveredAt: order.deliveredAt
    //             }
    //         };
    //     } catch (error) {
    //         console.error('Error getting order by ID:', error);
            
    //         if (error instanceof CustomError) {
    //             throw error;
    //         }
            
    //         throw new CustomError('Failed to retrieve order', HttpStatusCode.INTERNAL_SERVER, true);
    //     }
    // },
    getOrderById: async (userId, orderId) => {
        try {
            console.log('Getting order by ID:', { userId, orderId });
    
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                throw new CustomError('Invalid order ID format', HttpStatusCode.BAD_REQUEST, true);
            }
    
            const order = await CheckoutRepository.getOrderById(orderId);
            
            // Verify the order belongs to the user
            const orderUserId = order.userId.toString();
            const requestUserId = userId.toString();
    
            if (orderUserId !== requestUserId) {
                throw new CustomError('Order not found or does not belong to user', HttpStatusCode.FORBIDDEN, true);
            }
    
            // Format items to include image
            const formattedItems = order.items.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.productName,
                productDescription: item.productDescription,
                color: item.color,
                colorCode: item.colorCode,
                size: item.size,
                sku: item.sku,
                price: item.price,
                discountPrice: item.discountPrice,
                quantity: item.quantity,
                itemTotal: item.itemTotal,
                image: item.image,
                category: item.category,
                gender: item.gender
            }));

            // Generate invoice for paid orders
            let invoiceData = null;
            if (order.paymentStatus === 'paid') {
                try {
                    const invoiceResult = await InvoiceService.generateInvoice(orderId, userId);
                    invoiceData = invoiceResult.data;
                } catch (invoiceError) {
                    console.error('Error generating invoice for order:', invoiceError);
                    // Don't fail the order retrieval if invoice generation fails
                }
            }
    
            return {
                success: true,
                message: 'Order retrieved successfully',
                data: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    items: formattedItems,
                    shippingAddress: order.shippingAddress,
                    billingAddress: order.billingAddress,
                    totals: {
                        subtotal: order.subtotal,
                        shippingFee: order.shippingFee,
                        tax: order.tax,
                        discount: order.discount,
                        totalAmount: order.totalAmount
                    },
                    paymentStatus: order.paymentStatus,
                    orderStatus: order.orderStatus,
                    paymentMethod: order.paymentMethod,
                    razorpayOrderId: order.razorpayOrderId,
                    razorpayPaymentId: order.razorpayPaymentId,
                    notes: order.notes,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                    cancelledAt: order.cancelledAt,
                    deliveredAt: order.deliveredAt,
                    invoice: invoiceData // Include invoice data if available
                }
            };
        } catch (error) {
            console.error('Error getting order by ID:', error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw new CustomError('Failed to retrieve order', HttpStatusCode.INTERNAL_SERVER, true);
        }
    },

    getUserOrders: async (userId, options = {}) => {
        try {
            console.log('Getting user orders:', { userId, options });
    
            const { 
                page = 1, 
                limit = 10, 
                status, 
                paymentStatus 
            } = options;
    
            // Validate pagination parameters
            if (page < 1 || limit < 1 || limit > 100) {
                throw new CustomError('Invalid pagination parameters', HttpStatusCode.BAD_REQUEST, true);
            }
    
            const result = await CheckoutRepository.getUserOrders(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                paymentStatus
            });

            console.log("Orders:  ",result)
    
            // Format orders for response with images
            const formattedOrders = result.orders.map(order => ({
                orderId: order.id,
                orderNumber: order.orderNumber,
                items: order.items.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    productName: item.productName,
                    productDescription: item.productDescription,
                    color: item.color,
                    colorCode: item.colorCode,
                    size: item.size,
                    sku: item.sku,
                    price: item.price,
                    discountPrice: item.discountPrice,
                    quantity: item.quantity,
                    itemTotal: item.itemTotal,
                    image: item.image, // Include product image
                    category: item.category,
                    gender: item.gender
                })),
                shippingAddress: order.shippingAddress,
                totals: {
                    subtotal: order.subtotal,
                    shippingFee: order.shippingFee,
                    tax: order.tax,
                    discount: order.discount,
                    totalAmount: order.totalAmount
                },
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                paymentMethod: order.paymentMethod,
                razorpayOrderId: order.razorpayOrderId,
                razorpayPaymentId: order.razorpayPaymentId,
                notes: order.notes,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                cancelledAt: order.cancelledAt,
                deliveredAt: order.deliveredAt,
                itemCount: order.items.length,
                totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0)
            }));
    
            return {
                success: true,
                message: 'Orders retrieved successfully',
                data: {
                    orders: formattedOrders,
                    pagination: {
                        current: result.pagination.page,
                        limit: result.pagination.limit,
                        total: result.pagination.total,
                        pages: result.pagination.pages,
                        hasNext: result.pagination.page < result.pagination.pages,
                        hasPrev: result.pagination.page > 1
                    },
                    filters: {
                        status,
                        paymentStatus
                    },
                    summary: {
                        totalOrders: result.pagination.total,
                        ordersOnPage: formattedOrders.length
                    }
                }
            };
        } catch (error) {
            console.error('Error getting user orders:', error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw new CustomError('Failed to retrieve orders', HttpStatusCode.INTERNAL_SERVER, true);
        }
    }
};

export default CheckoutService;