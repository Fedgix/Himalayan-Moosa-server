import { formatTimestamp } from '../utils/emailUtils.js';

/**
 * Generates HTML template for contact form notifications
 * @param {Object} contactData - Contact form data
 * @returns {string} HTML template string
 */
export const generateContactEmailTemplate = (contactData) => {
    const timestamp = formatTimestamp(contactData.submittedAt);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 3px; border-left: 3px solid #007bff; }
            .comment { max-height: 100px; overflow-y: auto; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; }
            .status { display: inline-block; padding: 5px 10px; background: #ffc107; color: #000; border-radius: 3px; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔔 New Contact Form Submission</h2>
            </div>
            <div class="content">
                <div class="field">
                    <div class="label">👤 Name:</div>
                    <div class="value">${contactData.name}</div>
                </div>
                <div class="field">
                    <div class="label">📧 Email:</div>
                    <div class="value"><a href="mailto:${contactData.email}">${contactData.email}</a></div>
                </div>
                <div class="field">
                    <div class="label">📱 Phone Number:</div>
                    <div class="value"><a href="tel:${contactData.phoneNumber}">${contactData.phoneNumber}</a></div>
                </div>
                <div class="field">
                    <div class="label">💬 Comment:</div>
                    <div class="value comment">${contactData.comment}</div>
                </div>
                <div class="field">
                    <div class="label">📅 Submitted At:</div>
                    <div class="value">${timestamp}</div>
                </div>
                <div class="field">
                    <div class="label">🏷️ Status:</div>
                    <div class="value"><span class="status">${contactData.status || 'Pending'}</span></div>
                </div>
            </div>
            <div class="footer">
                <p>Please review and respond to this inquiry promptly.</p>
                <small>This is an automated notification from your website contact form.</small>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generates plain text template for contact form notifications
 * @param {Object} contactData - Contact form data
 * @returns {string} Plain text template string
 */
export const generateContactTextTemplate = (contactData) => {
    const timestamp = formatTimestamp(contactData.submittedAt);

    return `
🔔 NEW CONTACT FORM SUBMISSION

👤 Name: ${contactData.name}
📧 Email: ${contactData.email}
📱 Phone: ${contactData.phoneNumber}
💬 Comment: ${contactData.comment}
📅 Submitted: ${timestamp}
🏷️ Status: ${contactData.status || 'Pending'}

Please review and respond to this inquiry promptly.
    `;
};