import SubscriptionModel from '../models/subscription.model.js';

const SubscriptionRepository = {
    async addSubscription(subscriptionEntity) {
        return await SubscriptionModel.create(subscriptionEntity);
    },
    async findByEmail(email) {
        return await SubscriptionModel.findOne({ email });
    },
    async unsubscribeByEmail(email) {
        return await SubscriptionModel.findOneAndUpdate(
            { email },
            { $set: { subscribed: false } },
            { new: true }
        );
    },
    async getAllSubscribed() {
        return await SubscriptionModel.find({ subscribed: true });
    }
};

export default SubscriptionRepository; 