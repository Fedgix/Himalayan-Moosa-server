import express from 'express';
import SubscriptionController from '../../modules/subscribe/controller/subscription.controller.js';

const subscribeRouter = express.Router();

// Subscribe (POST /subscribe)
subscribeRouter.post('/', SubscriptionController.subscribe);

// Unsubscribe (POST /subscribe/unsubscribe)
subscribeRouter.post('/unsubscribe', SubscriptionController.unsubscribe);

// Get all subscribed emails (GET /subscribe/subscribers)
subscribeRouter.get('/subscribers', SubscriptionController.getAll);

export default subscribeRouter; 