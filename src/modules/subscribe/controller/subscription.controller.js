import SubscriptionService from '../service/subscription.service.js';
import CustomError from '../../../utils/custom.error.js';
import { sendSuccess } from '../../../utils/response.handler.js';

export const SubscriptionController = {
    async subscribe(req, res, next) {
        try {
            const email = req.body.email || (req.user && req.user.email);
            if (!email) {
                throw new CustomError('Email is required', 400, true);
            }
            const result = await SubscriptionService.subscribeUser(email);
            sendSuccess(res, 'Subscribed successfully', result);
        } catch (err) {
            next(err);
        }
    },
    async unsubscribe(req, res, next) {
        try {
            const email = req.body.email || (req.user && req.user.email);
            if (!email) {
                throw new CustomError('Email is required', 400, true);
            }
            const result = await SubscriptionService.unsubscribeUser(email);
            sendSuccess(res, 'Unsubscribed successfully', result);
        } catch (err) {
            next(err);
        }
    },
    async getAll(req, res, next) {
        try {
            const emails = await SubscriptionService.getAllSubscribedEmails();
            sendSuccess(res, 'Fetched all subscribed emails', { emails });
        } catch (err) {
            next(err);
        }
    }
};

export default SubscriptionController; 