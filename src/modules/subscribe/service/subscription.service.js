import SubscriptionRepository from '../repository/subscription.repository.js';
import SubscriptionEntity from '../entity/subscription.entity.js';
import { generateProductCreatedEmailTemplate } from '../../../templates/productTemplate.js';
import { createTransporter, sendBulkEmails } from '../../../utils/emailUtils.js';
import { emailConfig } from '../../../config/emailConfig.js'; 

const SubscriptionService = {
    async subscribeUser(email) {
        let existing = await SubscriptionRepository.findByEmail(email);
        if (existing) {
            if (!existing.subscribed) {
                // Re-subscribe
                existing = await SubscriptionRepository.addSubscription({
                    email,
                    subscribed: true
                });
            }
            return existing;
        }
        const entity = new SubscriptionEntity({ email });
        return await SubscriptionRepository.addSubscription(entity);
    },
    async unsubscribeUser(email) {
        return await SubscriptionRepository.unsubscribeByEmail(email);
    },
    async getAllSubscribedEmails() {
        const subs = await SubscriptionRepository.getAllSubscribed();
        return subs.map(s => s.email);
    },
    async notifySubscribersOfNewProduct(productData, productUrl) {
        try {
            const emails = await this.getAllSubscribedEmails();
            console.log('[SubscriptionService] Subscribed emails:', emails);
            if (!emails.length) {
                console.log('[SubscriptionService] No subscribers found. Skipping email notification.');
                return { success: false, message: 'No subscribers' };
            }
            const transporter = createTransporter(emailConfig.smtp);
            // Use productAlert template config, with fallback
            const productTemplateConfig = (emailConfig.templates && emailConfig.templates.productAlert) || {};
            const placeholderImage = productTemplateConfig.placeholderImage || '';
            const subject = (productTemplateConfig.subject && productTemplateConfig.subject(productData.name)) || `New Product: ${productData.name}`;
            console.log('[SubscriptionService] Email subject:', subject);
            const htmlContent = (data) => generateProductCreatedEmailTemplate(data, productUrl, placeholderImage);
            const createMailOptions = (email) => ({
                from: `"${emailConfig.addresses.fromName}" <${emailConfig.addresses.from}>`,
                to: email,
                subject,
                html: htmlContent(productData)
            });
            const result = await sendBulkEmails(transporter, emails, createMailOptions, 500);
            console.log("transporter: ",transporter)
            console.log('[SubscriptionService] sendBulkEmails result:', result);
            return result;
        } catch (err) {
            console.error('[SubscriptionService] Error in notifySubscribersOfNewProduct:', err);
            return { success: false, message: err.message, error: err };
        }
    }
};

export default SubscriptionService; 