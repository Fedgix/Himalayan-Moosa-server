import axios from 'axios';

export class WhatsAppNotification {
    constructor(config = {}) {
        this.apiUrl = config.apiUrl || process.env.WHATSAPP_API_URL;
        this.apiToken = config.apiToken || process.env.WHATSAPP_API_TOKEN;
        this.adminPhone = config.adminPhone || process.env.ADMIN_WHATSAPP_NUMBER;
    }

    async sendContactNotification(contactData) {
        try {
            const message = this.formatContactMessage(contactData);
            return await this.sendMessage(this.adminPhone, message);
        } catch (error) {
            console.error('WhatsApp Notification Error:', error);
            return {
                success: false,
                message: 'Failed to send WhatsApp notification',
                error: error.message
            };
        }
    }

    formatContactMessage(contactData) {
        const timestamp = contactData.submittedAt ? 
            new Date(contactData.submittedAt).toLocaleString() : 
            new Date().toLocaleString();

        return `🔔 *New Contact Form Submission*

👤 *Name:* ${contactData.name}
📧 *Email:* ${contactData.email}
📱 *Phone:* ${contactData.phoneNumber}
💬 *Comment:* ${contactData.comment}
📅 *Submitted:* ${timestamp}
🏷️ *Status:* ${contactData.status || 'Pending'}

Please review and respond to this inquiry.`;
    }

    async sendMessage(phoneNumber, message) {
        try {
            // Example for WhatsApp Business API
            const response = await axios.post(`${this.apiUrl}/messages`, {
                messaging_product: "whatsapp",
                to: phoneNumber,
                type: "text",
                text: {
                    body: message
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                message: 'WhatsApp message sent successfully',
                messageId: response.data.messages?.[0]?.id
            };
        } catch (error) {
            console.error('WhatsApp API Error:', error.response?.data || error.message);
            return {
                success: false,
                message: 'Failed to send WhatsApp message',
                error: error.response?.data || error.message
            };
        }
    }

    async sendCustomMessage(phoneNumber, message) {
        return await this.sendMessage(phoneNumber, message);
    }

    async sendBulkNotification(phoneNumbers, message) {
        const results = [];
        
        for (const phoneNumber of phoneNumbers) {
            const result = await this.sendMessage(phoneNumber, message);
            results.push({
                phoneNumber,
                ...result
            });
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return results;
    }
}