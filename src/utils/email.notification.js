import { createTransporter, sendEmail } from './emailUtils.js';
import { generateContactEmailTemplate, generateContactTextTemplate } from '../templates/contactTemplate.js';

export class EmailNotification {
    constructor(config) {
        this.config = config;
        this.transporter = createTransporter(config.smtp);
    }

    async sendContactNotification(contactData) {
        try {
            const htmlContent = generateContactEmailTemplate(contactData);
            const textContent = generateContactTextTemplate(contactData);

            const mailOptions = {
                from: `"${this.config.addresses.fromName}" <${this.config.addresses.from}>`,
                to: this.config.addresses.admin,
                subject: this.config.templates.contact.subject(contactData.name),
                text: textContent,
                html: htmlContent,
                replyTo: contactData.email
            };

            return await sendEmail(
                this.transporter, 
                mailOptions, 
                'Contact Form Notification'
            );
        } catch (error) {
            console.error('Email notification error:', error);
            return {
                success: false,
                message: 'Failed to send email notification',
                error: error.message
            };
        }
    }

    async sendCustomNotification(subject, content, recipient = null) {
        try {
            const mailOptions = {
                from: `"${this.config.addresses.fromName}" <${this.config.addresses.from}>`,
                to: recipient || this.config.addresses.admin,
                subject: subject,
                html: content
            };

            return await sendEmail(
                this.transporter, 
                mailOptions, 
                'Custom Notification'
            );
        } catch (error) {
            console.error('Custom email notification error:', error);
            return {
                success: false,
                message: 'Failed to send custom email notification',
                error: error.message
            };
        }
    }

    async validateConnection() {
        try {
            await this.transporter.verify();
            return {
                success: true,
                message: 'Email service connection successful'
            };
        } catch (error) {
            console.error('Email service connection error:', error);
            return {
                success: false,
                message: 'Email service connection failed',
                error: error.message
            };
        }
    }
}