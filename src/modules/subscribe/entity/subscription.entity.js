class SubscriptionEntity {
    constructor({ email, subscribed = true, createdAt }) {
        this.email = email;
        this.subscribed = subscribed;
        this.createdAt = createdAt || new Date();
    }
}

export default SubscriptionEntity; 