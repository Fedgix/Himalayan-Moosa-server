import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export class GoogleSheetsHandler {
    constructor(config = {}) {
        this.serviceAccountPath = config.serviceAccountPath || 
            path.resolve(new URL('.', import.meta.url).pathname, '../config/rizo-461205-f06b1fbb5863.json');
        this.spreadsheetIds = config.spreadsheetIds || {};
        // Add your email here to auto-share created sheets
        this.ownerEmail = config.ownerEmail || 'rizo.ind.in@gmail.com';
        this.auth = null;
        this.sheets = null;
        this.drive = null;

        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            if (!fs.existsSync(this.serviceAccountPath)) {
                console.warn('⚠️  Google Sheets disabled: Service account file not found at', this.serviceAccountPath);
                this.auth = null;
                this.sheets = null;
                this.drive = null;
                return;
            }

            const credentials = JSON.parse(fs.readFileSync(this.serviceAccountPath, 'utf8'));

            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive.file',
                    'https://www.googleapis.com/auth/drive'
                ]
            });

            // Get authenticated client
            const authClient = await this.auth.getClient();
            this.sheets = google.sheets({ version: 'v4', auth: authClient });
            this.drive = google.drive({ version: 'v3', auth: authClient });

            console.log('✅ Google Sheets API initialized successfully');
            
            // Test the connection
            await this.testConnection();
            
        } catch (error) {
            console.warn('⚠️  Google Sheets disabled:', error.message);
            this.auth = null;
            this.sheets = null;
            this.drive = null;
        }
    }

    async testConnection() {
        if (!this.drive) return false;
        try {
            const response = await this.drive.files.list({
                pageSize: 1,
                fields: 'files(id, name)'
            });
            console.log('✅ Google Drive connection test successful');
            return true;
        } catch (error) {
            console.warn('⚠️  Google Drive connection test failed:', error.message);
            return false;
        }
    }

    isAvailable() {
        return this.sheets !== null && this.drive !== null;
    }

    async createSpreadsheet(title, folderName = 'FormData') {
        if (!this.sheets || !this.drive) {
            throw new Error('Google Sheets not configured (service account file missing)');
        }
        try {
            console.log(`📊 Creating spreadsheet: ${title}`);
            
            // Create the spreadsheet first
            const response = await this.sheets.spreadsheets.create({
                resource: { 
                    properties: { title },
                    sheets: [{
                        properties: {
                            title: 'Sheet1',
                            gridProperties: {
                                rowCount: 1000,
                                columnCount: 26
                            }
                        }
                    }]
                }
            });

            const spreadsheetId = response.data.spreadsheetId;
            const spreadsheetUrl = response.data.spreadsheetUrl;
            
            console.log(`✅ Spreadsheet created: ${title} (ID: ${spreadsheetId})`);

            // Share with owner email immediately
            await this.shareSpreadsheet(spreadsheetId, this.ownerEmail, 'writer');

            // Try to move to folder (non-critical)
            try {
                const folderId = await this.getOrCreateFolder(folderName);
                if (folderId) {
                    await this.drive.files.update({
                        fileId: spreadsheetId,
                        addParents: folderId,
                        fields: 'id, parents'
                    });
                    console.log(`📁 Moved spreadsheet to folder: ${folderName}`);
                }
            } catch (folderError) {
                console.warn('⚠️  Could not move to folder, but spreadsheet created successfully:', folderError.message);
            }

            return spreadsheetId;
        } catch (error) {
            console.error('❌ Error creating spreadsheet:', error);
            throw error;
        }
    }

    async shareSpreadsheet(spreadsheetId, email, role = 'writer') {
        try {
            await this.drive.permissions.create({
                fileId: spreadsheetId,
                resource: {
                    role: role, // 'owner', 'writer', 'reader'
                    type: 'user',
                    emailAddress: email
                },
                sendNotificationEmail: false // Set to true if you want email notifications
            });
            
            console.log(`✅ Shared spreadsheet with ${email} as ${role}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to share spreadsheet with ${email}:`, error);
            // Don't throw error here - sharing failure shouldn't break the main flow
            return false;
        }
    }

    async getOrCreateFolder(folderName) {
        try {
            // First, try to find existing folder
            const response = await this.drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)'
            });

            if (response.data.files.length > 0) {
                const folderId = response.data.files[0].id;
                console.log(`📁 Found existing folder: ${folderName} (ID: ${folderId})`);
                
                // Share folder with owner email too
                await this.shareSpreadsheet(folderId, this.ownerEmail, 'writer');
                
                return folderId;
            }

            // Create new folder
            const folderResponse = await this.drive.files.create({
                resource: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });

            const folderId = folderResponse.data.id;
            console.log(`✅ Created new folder: ${folderName} (ID: ${folderId})`);
            
            // Share folder with owner email
            await this.shareSpreadsheet(folderId, this.ownerEmail, 'writer');

            return folderId;
        } catch (error) {
            console.error('❌ Error with folder operations:', error);
            return null; // Return null instead of throwing - folder is optional
        }
    }

    // Get the actual sheet ID from the spreadsheet
    async getSheetId(spreadsheetId, sheetName = 'Sheet1') {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
                fields: 'sheets(properties(sheetId,title))'
            });

            const sheet = response.data.sheets.find(sheet => 
                sheet.properties.title === sheetName
            );

            if (sheet) {
                return sheet.properties.sheetId;
            }

            // If no sheet found with the name, return the first sheet's ID
            return response.data.sheets[0]?.properties?.sheetId || 0;
        } catch (error) {
            console.error('❌ Error getting sheet ID:', error);
            return 0; // Fallback to 0
        }
    }

    async addContactToSheet(contactData) {
        if (!this.sheets) {
            return { success: false, message: 'Google Sheets not configured (service account file missing)' };
        }
        try {
            console.log('📝 Adding contact to sheet:', contactData.name);
            
            let spreadsheetId = this.spreadsheetIds.contacts;

            // Create spreadsheet if it doesn't exist
            if (!spreadsheetId) {
                console.log('📊 Creating new contact spreadsheet...');
                spreadsheetId = await this.createSpreadsheet('Contact Forms - ' + new Date().toISOString().split('T')[0]);
                this.spreadsheetIds.contacts = spreadsheetId;
                
                // Create headers
                await this.createContactHeaders(spreadsheetId);
            }

            // Prepare row data with better formatting
            const rowData = [
                contactData.id || 'N/A',
                contactData.name || '',
                contactData.email || '',
                contactData.phoneNumber || '',
                contactData.comment || '',
                contactData.status || 'pending',
                contactData.submittedAt ? new Date(contactData.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                contactData.createdAt ? new Date(contactData.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            ];

            // Add the row
            const appendResponse = await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Sheet1!A:H',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { 
                    values: [rowData]
                }
            });

            console.log('✅ Contact added to Google Sheet successfully');

            return {
                success: true,
                message: 'Contact added to Google Sheet successfully',
                spreadsheetId,
                url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
                range: appendResponse.data.updates.updatedRange,
                rowsAdded: appendResponse.data.updates.updatedRows
            };
        } catch (error) {
            console.error('❌ Google Sheets Handler Error:', error);
            
            // Provide more detailed error information
            let errorMessage = 'Failed to add contact to Google Sheet';
            if (error.code === 403) {
                errorMessage = 'Permission denied - Check service account permissions';
            } else if (error.code === 404) {
                errorMessage = 'Spreadsheet not found - It may have been deleted';
            } else if (error.message.includes('Invalid requests')) {
                errorMessage = 'Invalid data format for Google Sheets';
            }

            return {
                success: false,
                message: errorMessage,
                error: error.message,
                code: error.code
            };
        }
    }

    async createContactHeaders(spreadsheetId) {
        try {
            console.log('📋 Creating contact headers...');
            
            const headers = [
                'ID', 'Name', 'Email', 'Phone Number', 'Comment', 
                'Status', 'Submitted At', 'Created At'
            ];

            // Add headers first
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Sheet1!A1:H1',
                valueInputOption: 'USER_ENTERED',
                resource: { values: [headers] }
            });

            // Get the actual sheet ID
            const sheetId = await this.getSheetId(spreadsheetId, 'Sheet1');
            console.log(`📋 Using sheet ID: ${sheetId} for formatting`);

            // Format headers with styling - only if we have a valid sheet ID
            if (sheetId !== null) {
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    resource: {
                        requests: [
                            {
                                repeatCell: {
                                    range: {
                                        sheetId: sheetId,
                                        startRowIndex: 0,
                                        endRowIndex: 1,
                                        startColumnIndex: 0,
                                        endColumnIndex: 8
                                    },
                                    cell: {
                                        userEnteredFormat: {
                                            backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                                            textFormat: { 
                                                foregroundColor: { red: 1, green: 1, blue: 1 }, 
                                                bold: true,
                                                fontSize: 12
                                            },
                                            horizontalAlignment: 'CENTER'
                                        }
                                    },
                                    fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
                                }
                            },
                            {
                                updateDimensionProperties: {
                                    range: {
                                        sheetId: sheetId,
                                        dimension: 'COLUMNS',
                                        startIndex: 0,
                                        endIndex: 8
                                    },
                                    properties: { pixelSize: 150 },
                                    fields: 'pixelSize'
                                }
                            },
                            {
                                updateSheetProperties: {
                                    properties: {
                                        sheetId: sheetId,
                                        gridProperties: {
                                            frozenRowCount: 1
                                        }
                                    },
                                    fields: 'gridProperties.frozenRowCount'
                                }
                            }
                        ]
                    }
                });

                console.log('✅ Contact headers created and formatted');
            } else {
                console.log('✅ Contact headers created (formatting skipped due to sheet ID issue)');
            }
        } catch (error) {
            console.error('❌ Error creating headers:', error);
            // Don't throw error here - headers were added, formatting just failed
            console.log('⚠️  Headers added but formatting failed - continuing...');
        }
    }

    // Get all spreadsheet URLs for the owner
    getSpreadsheetUrls() {
        const urls = {};
        for (const [key, spreadsheetId] of Object.entries(this.spreadsheetIds)) {
            if (spreadsheetId) {
                urls[key] = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
            }
        }
        return urls;
    }

    // Check if spreadsheet exists and is accessible
    async verifySpreadsheet(spreadsheetId) {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
                fields: 'properties'
            });
            
            return {
                exists: true,
                title: response.data.properties.title,
                url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
            };
        } catch (error) {
            return {
                exists: false,
                error: error.message
            };
        }
    }

    // Reset spreadsheet IDs (useful for testing)
    resetSpreadsheetIds() {
        this.spreadsheetIds = {};
        console.log('🔄 Spreadsheet IDs reset');
    }

    async addOrderToSheet(orderData) {
        if (!this.sheets) {
            return { success: false, message: 'Google Sheets not configured (service account file missing)' };
        }
        try {
            let spreadsheetId = this.spreadsheetIds.orders;

            if (!spreadsheetId) {
                spreadsheetId = await this.createSpreadsheet('Orders - ' + new Date().toISOString().split('T')[0]);
                this.spreadsheetIds.orders = spreadsheetId;
                await this.createOrderHeaders(spreadsheetId);
            }

            const rowData = [
                orderData.orderId || orderData.id,
                orderData.customerName,
                orderData.customerEmail,
                orderData.customerPhone,
                orderData.productName,
                orderData.productSku,
                orderData.quantity,
                orderData.unitPrice,
                orderData.totalAmount,
                orderData.paymentStatus || 'pending',
                orderData.orderStatus || 'processing',
                orderData.shippingAddress,
                orderData.orderDate ? new Date(orderData.orderDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                orderData.createdAt ? new Date(orderData.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Sheet1!A:N',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values: [rowData] }
            });

            return {
                success: true,
                message: 'Order added to Google Sheet successfully',
                spreadsheetId,
                url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
            };
        } catch (error) {
            console.error('Error adding order to sheet:', error);
            return {
                success: false,
                message: 'Failed to add order to Google Sheet',
                error: error.message
            };
        }
    }

    async createOrderHeaders(spreadsheetId) {
        try {
            const headers = [
                'Order ID', 'Customer Name', 'Customer Email', 'Customer Phone',
                'Product Name', 'Product SKU', 'Quantity', 'Unit Price', 'Total Amount',
                'Payment Status', 'Order Status', 'Shipping Address', 'Order Date', 'Created At'
            ];

            // Add headers first
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Sheet1!A1:N1',
                valueInputOption: 'USER_ENTERED',
                resource: { values: [headers] }
            });

            // Get the actual sheet ID and format if possible
            const sheetId = await this.getSheetId(spreadsheetId, 'Sheet1');
            
            if (sheetId !== null) {
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    resource: {
                        requests: [
                            {
                                repeatCell: {
                                    range: {
                                        sheetId: sheetId,
                                        startRowIndex: 0,
                                        endRowIndex: 1,
                                        startColumnIndex: 0,
                                        endColumnIndex: 14
                                    },
                                    cell: {
                                        userEnteredFormat: {
                                            backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                                            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                                        }
                                    },
                                    fields: 'userEnteredFormat(backgroundColor,textFormat)'
                                }
                            }
                        ]
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error creating order headers:', error);
            // Don't throw - headers were likely added
        }
    }
}