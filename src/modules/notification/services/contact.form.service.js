// contact.form.service.js (Updated with proper configuration)
import { ContactFormRepository } from '../repositories/contact.form.repository.js';
import ContactEntity from '../entity/contact.entity.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';
import { NotificationManager } from '../../../utils/notification.manager.js';
import { emailConfig } from '../../../config/emailConfig.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize notification manager with Google Sheets configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Now safely resolve the service account path with proper configuration
const notificationManager = new NotificationManager({
    serviceAccountPath: path.resolve(__dirname, '../../../config/rizo-461205-f06b1fbb5863.json'),
    email: emailConfig,
    // Add your email here so sheets are automatically shared with you
    ownerEmail: 'rizo.ind.in@gmail.com', // Add this line
    enabledServices: {
        sheets: true,
        whatsapp: false,
        email: true
    },
    spreadsheetIds: {} // This will be populated dynamically
});

export const ContactFormService = {
    async createContact(contactData) {
        console.log('📝 Creating new contact:', contactData.name);

        // Basic validation
        const { name, email, phoneNumber, comment } = contactData;

        if (!name || !email || !phoneNumber || !comment) {
            throw new CustomError(
                'All fields are required',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        if (comment.length > 200) {
            throw new CustomError(
                'Comment cannot exceed 200 characters',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            throw new CustomError(
                'Please enter a valid email address',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        // Validate phone number format
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
            throw new CustomError(
                'Please enter a valid phone number',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        try {
            // Save to database first
            console.log('💾 Saving contact to database...');
            const savedContact = await ContactFormRepository.create(contactData);
            const contactEntity = ContactEntity.fromDocument(savedContact);
            console.log('✅ Contact saved to database:', contactEntity.id);

            // Process notifications (Google Sheets + Email) - Run in background but wait a bit
            console.log('📤 Processing notifications...');
            this.processNotificationsAsync(contactEntity);

            return contactEntity;
        } catch (error) {
            console.error('❌ Error creating contact:', error);
            throw error;
        }
    },

    // Async notification processing to avoid blocking the main flow
    async processNotificationsAsync(contactEntity) {
        try {
            console.log('🔄 Starting notification processing for:', contactEntity.name);

            const contactData = {
                id: contactEntity.id,
                name: contactEntity.name,
                email: contactEntity.email,
                phoneNumber: contactEntity.phoneNumber,
                comment: contactEntity.comment,
                status: contactEntity.status,
                submittedAt: contactEntity.submittedAt,
                createdAt: contactEntity.createdAt
            };

            console.log('📊 Sending to Google Sheets...');
            const notificationResult = await notificationManager.processContactSubmission(contactData);

            console.log('📋 Notification Results:', JSON.stringify(notificationResult, null, 2));

            // Log results with more detail
            if (notificationResult.success) {
                console.log('✅ Notifications processed successfully');

                // Log Google Sheets URL if available
                if (notificationResult.results?.sheets?.success) {
                    console.log('📊 Contact added to Google Sheets successfully!');
                    console.log('🔗 Spreadsheet URL:', notificationResult.results.sheets.url);
                    console.log('📍 Range Added:', notificationResult.results.sheets.range);
                } else if (notificationResult.results?.sheets) {
                    console.error('❌ Google Sheets failed:', notificationResult.results.sheets.message);
                    console.error('🔍 Sheets Error:', notificationResult.results.sheets.error);
                }

                // Log email status
                if (notificationResult.results?.email?.success) {
                    console.log('📧 Email notification sent successfully');
                } else if (notificationResult.results?.email) {
                    console.error('❌ Email failed:', notificationResult.results.email.message);
                }
            } else {
                console.error('❌ Some notifications failed');
                console.error('📋 Failed Results:', notificationResult.results);

                // Log specific failures
                Object.keys(notificationResult.results || {}).forEach(service => {
                    const result = notificationResult.results[service];
                    if (!result.success) {
                        console.error(`❌ ${service.toUpperCase()} Error:`, result.message);
                        if (result.error) {
                            console.error(`🔍 ${service.toUpperCase()} Details:`, result.error);
                        }
                    }
                });
            }
        } catch (notificationError) {
            console.error('❌ Notification processing failed completely:', notificationError);
            console.error('🔍 Full error:', notificationError.stack);
            // Don't throw error here - contact was saved successfully
        }
    },

    // Test Google Sheets connection
    async testGoogleSheetsConnection() {
        try {
            console.log('🧪 Testing Google Sheets connection...');

            // Test with sample data
            const testContact = {
                id: 'test-' + Date.now(),
                name: 'Test Contact',
                email: 'test@example.com',
                phoneNumber: '+919876543210',
                comment: 'This is a test contact for connection verification',
                status: 'pending',
                submittedAt: new Date(),
                createdAt: new Date()
            };

            const result = await notificationManager.processContactSubmission(testContact);

            return {
                success: result.success,
                message: result.success ? 'Google Sheets connection working!' : 'Google Sheets connection failed',
                details: result
            };
        } catch (error) {
            console.error('❌ Google Sheets test failed:', error);
            return {
                success: false,
                message: 'Google Sheets test failed',
                error: error.message
            };
        }
    },

    async getAllContacts(filters = {}, options = {}) {
        try {
            const result = await ContactFormRepository.findAll(filters, options);

            return {
                ...result,
                contacts: ContactEntity.fromDocuments(result.contacts)
            };
        } catch (error) {
            console.error('Error getting all contacts:', error);
            throw error;
        }
    },

    async getContactById(id) {
        if (!id) {
            throw new CustomError(
                'Contact ID is required',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        const contact = await ContactFormRepository.findById(id);

        if (!contact) {
            throw new CustomError(
                'Contact form not found',
                HttpStatusCode.NOT_FOUND,
                true
            );
        }

        return ContactEntity.fromDocument(contact);
    },

    async updateContactStatus(id, status) {
        if (!id) {
            throw new CustomError(
                'Contact ID is required',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        if (!status) {
            throw new CustomError(
                'Status is required',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        const validStatuses = ['pending', 'reviewed', 'resolved'];

        if (!validStatuses.includes(status)) {
            throw new CustomError(
                'Invalid status. Must be one of: pending, reviewed, resolved',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        const updatedContact = await ContactFormRepository.updateStatus(id, status);
        return ContactEntity.fromDocument(updatedContact);
    },

    async getContactStatistics() {
        try {
            const stats = await ContactFormRepository.getContactStats();

            // Add additional computed statistics
            const enhancedStats = {
                ...stats,
                statusPercentages: {},
                summary: {
                    totalContacts: stats.totalContacts || 0,
                    pendingCount: 0,
                    reviewedCount: 0,
                    resolvedCount: 0
                }
            };

            // Calculate percentages and counts
            if (stats.statusBreakdown && stats.statusBreakdown.length > 0) {
                stats.statusBreakdown.forEach(item => {
                    const percentage = stats.totalContacts > 0
                        ? ((item.count / stats.totalContacts) * 100).toFixed(2)
                        : 0;

                    enhancedStats.statusPercentages[item.status] = percentage;

                    // Set summary counts
                    switch (item.status) {
                        case 'pending':
                            enhancedStats.summary.pendingCount = item.count;
                            break;
                        case 'reviewed':
                            enhancedStats.summary.reviewedCount = item.count;
                            break;
                        case 'resolved':
                            enhancedStats.summary.resolvedCount = item.count;
                            break;
                    }
                });
            }

            return enhancedStats;
        } catch (error) {
            console.error('Error getting contact statistics:', error);
            throw error;
        }
    },

    // Get Google Sheets information with better error handling
    async getGoogleSheetsInfo() {
        try {
            console.log('📊 Getting Google Sheets information...');

            const spreadsheetUrls = notificationManager.getSpreadsheetUrls();

            // Also verify each spreadsheet exists
            const verifiedSpreadsheets = {};
            for (const [key, url] of Object.entries(spreadsheetUrls)) {
                const spreadsheetId = url.split('/d/')[1];
                const verification = await notificationManager.googleSheetsHandler?.verifySpreadsheet(spreadsheetId);

                verifiedSpreadsheets[key] = {
                    url,
                    spreadsheetId,
                    verified: verification?.exists || false,
                    title: verification?.title || 'Unknown',
                    error: verification?.error || null
                };
            }

            return {
                success: true,
                spreadsheets: verifiedSpreadsheets,
                message: 'Google Sheets information retrieved successfully',
                ownerEmail: 'rizo.ind.in@gmail.com'
            };
        } catch (error) {
            console.error('❌ Error getting Google Sheets info:', error);
            return {
                success: false,
                message: 'Failed to retrieve Google Sheets information',
                error: error.message
            };
        }
    },

    // Manual sync to Google Sheets (in case of failures)
    async syncToGoogleSheets(contactId) {
        try {
            console.log('🔄 Manual sync to Google Sheets for contact:', contactId);

            const contact = await ContactFormService.getContactById(contactId);

            const contactData = {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phoneNumber: contact.phoneNumber,
                comment: contact.comment,
                status: contact.status,
                submittedAt: contact.submittedAt,
                createdAt: contact.createdAt
            };

            const result = await notificationManager.sendCustomNotification('contact', contactData);

            return {
                success: result.success,
                message: result.success
                    ? 'Contact synced to Google Sheets successfully'
                    : 'Failed to sync contact to Google Sheets',
                details: result,
                spreadsheetUrl: result.results?.sheets?.url || null
            };
        } catch (error) {
            console.error('❌ Error syncing to Google Sheets:', error);
            throw new CustomError(
                'Failed to sync contact to Google Sheets: ' + error.message,
                HttpStatusCode.INTERNAL_SERVER,
                true
            );
        }
    },


    // Bulk operations
    async bulkUpdateStatus(contactIds, status) {
        if (!Array.isArray(contactIds) || contactIds.length === 0) {
            throw new CustomError(
                'Contact IDs array is required',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        const validStatuses = ['pending', 'reviewed', 'resolved'];
        if (!validStatuses.includes(status)) {
            throw new CustomError(
                'Invalid status. Must be one of: pending, reviewed, resolved',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        try {
            const results = await Promise.allSettled(
                contactIds.map(id => ContactFormRepository.updateStatus(id, status))
            );

            const successful = results.filter(result => result.status === 'fulfilled');
            const failed = results.filter(result => result.status === 'rejected');

            return {
                totalProcessed: contactIds.length,
                successful: successful.length,
                failed: failed.length,
                updatedContacts: successful.map(result =>
                    ContactEntity.fromDocument(result.value)
                ),
                errors: failed.map(result => result.reason.message)
            };
        } catch (error) {
            console.error('Error in bulk update:', error);
            throw new CustomError(
                'Failed to process bulk update',
                HttpStatusCode.INTERNAL_SERVER,
                true
            );
        }
    },

    async deleteContact(id) {
        if (!id) {
            throw new CustomError(
                'Contact ID is required',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        // Check if contact exists
        const contact = await ContactFormRepository.findById(id);
        if (!contact) {
            throw new CustomError(
                'Contact form not found',
                HttpStatusCode.NOT_FOUND,
                true
            );
        }

        // Delete from database
        await ContactFormRepository.deleteById(id);

        return {
            message: 'Contact form deleted successfully',
            deletedContact: ContactEntity.fromDocument(contact)
        };
    },

    // Search contacts by various fields
    async searchContacts(searchTerm, options = {}) {
        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new CustomError(
                'Search term must be at least 2 characters long',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        const searchFilters = {
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { phoneNumber: { $regex: searchTerm, $options: 'i' } },
                { comment: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        const result = await ContactFormRepository.findAll(searchFilters, options);

        return {
            ...result,
            contacts: ContactEntity.fromDocuments(result.contacts),
            searchTerm: searchTerm.trim()
        };
    },

    // Export contacts data
    async exportContacts(format = 'json', filters = {}) {
        const validFormats = ['json', 'csv'];
        if (!validFormats.includes(format)) {
            throw new CustomError(
                'Invalid export format. Must be json or csv',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        // Get all contacts without pagination
        const options = { page: 1, limit: 10000 }; // Large limit to get all
        const result = await ContactFormService.getAllContacts(filters, options);

        if (format === 'csv') {
            // Convert to CSV format
            const headers = ['ID', 'Name', 'Email', 'Phone Number', 'Comment', 'Status', 'Submitted At', 'Created At'];
            const csvData = [
                headers.join(','),
                ...result.contacts.map(contact => [
                    contact.id,
                    `"${contact.name}"`,
                    contact.email,
                    contact.phoneNumber,
                    `"${contact.comment.replace(/"/g, '""')}"`, // Escape quotes
                    contact.status,
                    contact.submittedAt,
                    contact.createdAt
                ].join(','))
            ].join('\n');

            return {
                format: 'csv',
                data: csvData,
                filename: `contacts_export_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        return {
            format: 'json',
            data: result.contacts,
            totalExported: result.contacts.length,
            filename: `contacts_export_${new Date().toISOString().split('T')[0]}.json`
        };
    },

    // Get Google Sheets information
    async getGoogleSheetsInfo() {
        try {
            const spreadsheetUrls = notificationManager.getSpreadsheetUrls();
            return {
                success: true,
                spreadsheets: spreadsheetUrls,
                message: 'Google Sheets information retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting Google Sheets info:', error);
            return {
                success: false,
                message: 'Failed to retrieve Google Sheets information',
                error: error.message
            };
        }
    },

    // Manual sync to Google Sheets (in case of failures)
    async syncToGoogleSheets(contactId) {
        try {
            const contact = await ContactFormService.getContactById(contactId);

            const result = await notificationManager.sendCustomNotification('contact', {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phoneNumber: contact.phoneNumber,
                comment: contact.comment,
                status: contact.status,
                submittedAt: contact.submittedAt,
                createdAt: contact.createdAt
            });

            return {
                success: result.success,
                message: result.success
                    ? 'Contact synced to Google Sheets successfully'
                    : 'Failed to sync contact to Google Sheets',
                details: result
            };
        } catch (error) {
            console.error('Error syncing to Google Sheets:', error);
            throw new CustomError(
                'Failed to sync contact to Google Sheets',
                HttpStatusCode.INTERNAL_SERVER,
                true
            );
        }
    }
};