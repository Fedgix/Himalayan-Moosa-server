import express from 'express';
import CheckoutController from '../../modules/checkout/controller/checkout.controller.js'; 
import { authenticateToken } from '../middlewares/auth.middleware.js'; 
import catchAsync from '../middlewares/catch.async.js';

const checkoutRouter = express.Router();

checkoutRouter.use(authenticateToken);

checkoutRouter.post('/initialize', catchAsync(CheckoutController.initializeCheckout));

checkoutRouter.post('/update-item', catchAsync(CheckoutController.updateCheckoutItem));

checkoutRouter.post('/remove-item', catchAsync(CheckoutController.removeCheckoutItem));

checkoutRouter.post('/create-order', catchAsync(CheckoutController.createOrder));

checkoutRouter.post('/verify-payment', catchAsync(CheckoutController.verifyPayment));

checkoutRouter.post('/payment-failure', catchAsync(CheckoutController.handlePaymentFailure));

checkoutRouter.get('/session', catchAsync(CheckoutController.getCurrentSession));

checkoutRouter.get('/orders', catchAsync(CheckoutController.getUserOrders));

checkoutRouter.get('/order/:orderId', catchAsync(CheckoutController.getOrderById));

export default checkoutRouter;