//checkout.controller.js
import CheckoutService from "../services/checkout.services.js"; 
import CustomError from "../../../utils/custom.error.js"; 
import HttpStatusCode from "../../../utils/http.status.codes.js"; 
import { sendSuccess } from "../../../utils/response.handler.js";

export const CheckoutController = {
    
    initializeCheckout: async (req, res) => {
        try {
            const userId = req.user.id;
            const { items, source = 'cart' } = req.body; // source can be 'cart' or 'direct'
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new CustomError('Items are required and must be a non-empty array', HttpStatusCode.BAD_REQUEST, true);
            }
            
            const result = await CheckoutService.initializeCheckout(userId, items, source);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    updateCheckoutItem: async (req, res) => {
        try {
            const userId = req.user.id;
            const { variantId, quantity } = req.body;
            if (!variantId || !quantity || quantity <= 0) {
                throw new CustomError('Variant ID and valid quantity are required', HttpStatusCode.BAD_REQUEST, true);
            }
            
            const result = await CheckoutService.updateCheckoutItem(userId, variantId, quantity);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    removeCheckoutItem: async (req, res) => {
        try {
            const userId = req.user.id;
            const { variantId } = req.body;
            
            if (!variantId) {
                throw new CustomError('Variant ID is required', HttpStatusCode.BAD_REQUEST, true);
            }
            
            const result = await CheckoutService.removeCheckoutItem(userId, variantId);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },


    createOrder: async (req, res) => {
        try {
            const userId = req.user.id;
            const { paymentMethod = 'razorpay', notes, addressId } = req.body;
            
            if (!addressId) {
                throw new CustomError('Address ID is required', HttpStatusCode.BAD_REQUEST, true);
            }
            
            const result = await CheckoutService.createOrder(userId, {
                paymentMethod,
                notes,
                addressId
            });
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.CREATED);
        } catch (error) {
            throw error;
        }
    },

    verifyPayment: async (req, res) => {
        try {
            const userId = req.user.id;
            const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            
            if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                throw new CustomError('Missing required payment verification data', HttpStatusCode.BAD_REQUEST, true);
            }
            
            const result = await CheckoutService.verifyRazorpayPayment(userId, {
                orderId,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    handlePaymentFailure: async (req, res) => {
        try {
            const userId = req.user.id;
            const { orderId, razorpay_order_id, error } = req.body;
            
            if (!orderId || !razorpay_order_id) {
                throw new CustomError('Order ID and Razorpay order ID are required', HttpStatusCode.BAD_REQUEST, true);
            }
            
            const result = await CheckoutService.handlePaymentFailure(userId, {
                orderId,
                razorpay_order_id,
                error
            });
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    getCurrentSession: async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await CheckoutService.getCurrentSession(userId);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    getOrderById: async (req, res) => {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;
            
            if (!orderId) {
                throw new CustomError('Order ID is required', HttpStatusCode.BAD_REQUEST, true);
            }
            
            const result = await CheckoutService.getOrderById(userId, orderId);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    getUserOrders: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, status, paymentStatus } = req.query;
            
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                paymentStatus
            };
            
            const result = await CheckoutService.getUserOrders(userId, options);
            
            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    }
};

export default CheckoutController;