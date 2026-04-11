//checkout.controller.js
import mongoose from "mongoose";
import CheckoutService from "../services/checkout.services.js";
import CustomError from "../../../utils/custom.error.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";
import { sendSuccess } from "../../../utils/response.handler.js";

function normalizeOptionalBodyId(id) {
    if (id === undefined || id === null) return null;
    const s = String(id).trim();
    return s === "" ? null : s;
}

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
            const { variantId, productId, quantity } = req.body;
            if (quantity === undefined || quantity === null || quantity <= 0) {
                throw new CustomError("Valid quantity is required", HttpStatusCode.BAD_REQUEST, true);
            }
            const normV = normalizeOptionalBodyId(variantId);
            const normP = normalizeOptionalBodyId(productId);
            if (!normV && !normP) {
                throw new CustomError(
                    "Provide variantId (for options like size/color) or productId (for products without variants) to identify the line item",
                    HttpStatusCode.BAD_REQUEST,
                    true
                );
            }
            if (normV && !mongoose.Types.ObjectId.isValid(normV)) {
                throw new CustomError("Invalid variant ID format", HttpStatusCode.BAD_REQUEST, true);
            }
            if (normP && !mongoose.Types.ObjectId.isValid(normP)) {
                throw new CustomError("Invalid product ID format", HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await CheckoutService.updateCheckoutItem(userId, {
                variantId: normV,
                productId: normP,
                quantity
            });

            sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
        } catch (error) {
            throw error;
        }
    },

    removeCheckoutItem: async (req, res) => {
        try {
            const userId = req.user.id;
            const { variantId, productId } = req.body;
            const normV = normalizeOptionalBodyId(variantId);
            const normP = normalizeOptionalBodyId(productId);
            if (!normV && !normP) {
                throw new CustomError(
                    "Provide variantId or productId to identify which item to remove",
                    HttpStatusCode.BAD_REQUEST,
                    true
                );
            }
            if (normV && !mongoose.Types.ObjectId.isValid(normV)) {
                throw new CustomError("Invalid variant ID format", HttpStatusCode.BAD_REQUEST, true);
            }
            if (normP && !mongoose.Types.ObjectId.isValid(normP)) {
                throw new CustomError("Invalid product ID format", HttpStatusCode.BAD_REQUEST, true);
            }

            const result = await CheckoutService.removeCheckoutItem(userId, {
                variantId: normV,
                productId: normP
            });

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