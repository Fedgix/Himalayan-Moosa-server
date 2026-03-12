import { GoogleSheetsHandler } from './google.sheets.handler.js';
import { WhatsAppNotification } from './whatsapp.notification.js';
import { EmailNotification } from './email.notification.js';

export class NotificationManager {
    constructor(config = {}) {
        this.sheetsHandler = new GoogleSheetsHandler({
            serviceAccountPath: config.serviceAccountPath || 
            path.resolve(__dirname, '../config/rizo-461205-f06b1fbb5863.json'),
            spreadsheetIds: config.spreadsheetIds || {}
        });

        this.whatsappNotification = new WhatsAppNotification(config.whatsapp);
        this.emailNotification = new EmailNotification(config.email);

        this.enabledServices = config.enabledServices || {
            sheets: true,
            whatsapp: true,
            email: true
        };

        this.dataTypeSettings = config.dataTypeSettings || {
            contacts: { sheets: true, whatsapp: true, email: true },
            orders: { sheets: true, whatsapp: true, email: true },
            products: { sheets: true, whatsapp: false, email: true }
        };
    }

    async processContactSubmission(contactData) {
        const results = {
            sheets: { success: false, message: 'Disabled' },
            whatsapp: { success: false, message: 'Disabled' },
            email: { success: false, message: 'Disabled' }
        };

        const settings = this.dataTypeSettings.contacts;

        if (this.enabledServices.sheets && settings.sheets) {
            try {
                results.sheets = await this.sheetsHandler.addContactToSheet(contactData);
            } catch (error) {
                results.sheets = {
                    success: false,
                    message: 'Failed to add to Google Sheets',
                    error: error.message
                };
            }
        }

        if (this.enabledServices.whatsapp && settings.whatsapp) {
            try {
                results.whatsapp = await this.whatsappNotification.sendContactNotification(contactData);
            } catch (error) {
                results.whatsapp = {
                    success: false,
                    message: 'Failed to send WhatsApp notification',
                    error: error.message
                };
            }
        }

        if (this.enabledServices.email && settings.email) {
            try {
                results.email = await this.emailNotification.sendContactNotification(contactData);
            } catch (error) {
                results.email = {
                    success: false,
                    message: 'Failed to send email notification',
                    error: error.message
                };
            }
        }

        return {
            success: Object.values(results).some(result => result.success),
            results,
            summary: {
                total: Object.keys(this.enabledServices).filter(key => 
                    this.enabledServices[key] && settings[key]
                ).length,
                successful: Object.values(results).filter(result => result.success).length,
                failed: Object.values(results).filter(result => 
                    !result.success && result.message !== 'Disabled'
                ).length
            }
        };
    }

    async processOrderSubmission(orderData) {
        const results = {
            sheets: { success: false, message: 'Disabled' },
            whatsapp: { success: false, message: 'Disabled' },
            email: { success: false, message: 'Disabled' }
        };

        const settings = this.dataTypeSettings.orders;

        if (this.enabledServices.sheets && settings.sheets) {
            try {
                results.sheets = await this.sheetsHandler.addOrderToSheet(orderData);
            } catch (error) {
                results.sheets = {
                    success: false,
                    message: 'Failed to add order to Google Sheets',
                    error: error.message
                };
            }
        }

        if (this.enabledServices.whatsapp && settings.whatsapp) {
            try {
                results.whatsapp = await this.whatsappNotification.sendOrderNotification(orderData);
            } catch (error) {
                results.whatsapp = {
                    success: false,
                    message: 'Failed to send WhatsApp notification',
                    error: error.message
                };
            }
        }

        if (this.enabledServices.email && settings.email) {
            try {
                results.email = await this.emailNotification.sendOrderNotification(orderData);
            } catch (error) {
                results.email = {
                    success: false,
                    message: 'Failed to send email notification',
                    error: error.message
                };
            }
        }

        return {
            success: Object.values(results).some(result => result.success),
            results,
            summary: {
                total: Object.keys(this.enabledServices).filter(key => 
                    this.enabledServices[key] && settings[key]
                ).length,
                successful: Object.values(results).filter(result => result.success).length,
                failed: Object.values(results).filter(result => 
                    !result.success && result.message !== 'Disabled'
                ).length
            }
        };
    }

    async processProductSubmission(productData) {
        const results = {
            sheets: { success: false, message: 'Disabled' },
            whatsapp: { success: false, message: 'Disabled' },
            email: { success: false, message: 'Disabled' }
        };

        const settings = this.dataTypeSettings.products;

        if (this.enabledServices.sheets && settings.sheets) {
            try {
                results.sheets = await this.sheetsHandler.addProductToSheet(productData);
            } catch (error) {
                results.sheets = {
                    success: false,
                    message: 'Failed to add product to Google Sheets',
                    error: error.message
                };
            }
        }

        if (this.enabledServices.whatsapp && settings.whatsapp) {
            try {
                results.whatsapp = await this.whatsappNotification.sendProductNotification(productData);
            } catch (error) {
                results.whatsapp = {
                    success: false,
                    message: 'Failed to send WhatsApp notification',
                    error: error.message
                };
            }
        }

        if (this.enabledServices.email && settings.email) {
            try {
                results.email = await this.emailNotification.sendProductNotification(productData);
            } catch (error) {
                results.email = {
                    success: false,
                    message: 'Failed to send email notification',
                    error: error.message
                };
            }
        }

        return {
            success: Object.values(results).some(result => result.success),
            results,
            summary: {
                total: Object.keys(this.enabledServices).filter(key => 
                    this.enabledServices[key] && settings[key]
                ).length,
                successful: Object.values(results).filter(result => result.success).length,
                failed: Object.values(results).filter(result => 
                    !result.success && result.message !== 'Disabled'
                ).length
            }
        };
    }

    async sendCustomNotification(type, data) {
        try {
            switch (type) {
                case 'sheets':
                case 'contact':
                    return await this.sheetsHandler.addContactToSheet(data);
                case 'order':
                    return await this.sheetsHandler.addOrderToSheet(data);
                case 'product':
                    return await this.sheetsHandler.addProductToSheet(data);
                case 'whatsapp':
                    return await this.whatsappNotification.sendContactNotification(data);
                case 'email':
                    return await this.emailNotification.sendContactNotification(data);
                default:
                    return { success: false, message: 'Invalid notification type' };
            }
        } catch (error) {
            console.error(`Error in custom notification (${type}):`, error);
            return {
                success: false,
                message: `Failed to send ${type} notification`,
                error: error.message
            };
        }
    }

    async getSpreadsheetInfo(type) {
        const spreadsheetId = this.sheetsHandler.spreadsheetIds[type];
        if (!spreadsheetId) {
            return { success: false, message: `No spreadsheet found for type: ${type}` };
        }
        return await this.sheetsHandler.getSpreadsheetInfo(spreadsheetId);
    }

    async exportData(type) {
        const spreadsheetId = this.sheetsHandler.spreadsheetIds[type];
        if (!spreadsheetId) {
            return { success: false, message: `No spreadsheet found for type: ${type}` };
        }
        return await this.sheetsHandler.exportDataFromSheet(spreadsheetId);
    }

    getSpreadsheetUrls() {
        const urls = {};
        Object.keys(this.sheetsHandler.spreadsheetIds).forEach(type => {
            const id = this.sheetsHandler.spreadsheetIds[type];
            if (id) {
                urls[type] = `https://docs.google.com/spreadsheets/d/${id}`;
            }
        });
        return urls;
    }

    updateDataTypeSettings(dataType, settings) {
        if (this.dataTypeSettings[dataType]) {
            this.dataTypeSettings[dataType] = { ...this.dataTypeSettings[dataType], ...settings };
            console.log(`Updated settings for ${dataType}:`, this.dataTypeSettings[dataType]);
        } else {
            console.warn(`Data type ${dataType} not found in settings`);
        }
    }

    getDataTypeSettings() {
        return this.dataTypeSettings;
    }

    isServiceEnabledForType(dataType, serviceType) {
        return this.enabledServices[serviceType] && 
               this.dataTypeSettings[dataType] && 
               this.dataTypeSettings[dataType][serviceType];
    }
}
