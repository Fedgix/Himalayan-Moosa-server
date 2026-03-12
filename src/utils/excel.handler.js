import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export class ExcelHandler {
    constructor(baseDir = './storage') {
        this.baseDir = baseDir;
        this.ensureDirectoryExists();
        
        // Define file paths for different types
        this.filePaths = {
            contacts: path.join(baseDir, 'contacts.xlsx'),
            orders: path.join(baseDir, 'orders.xlsx'),
            products: path.join(baseDir, 'products.xlsx'),
            subscribers: path.join(baseDir, 'subscribers.xlsx')
        };
    }

    ensureDirectoryExists() {
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    async addContactToExcel(contactData) {
        const newRow = {
            'ID': contactData.id || 'N/A',
            'Name': contactData.name,
            'Email': contactData.email,
            'Phone Number': contactData.phoneNumber,
            'Comment': contactData.comment,
            'Status': contactData.status || 'pending',
            'Submitted At': contactData.submittedAt ? new Date(contactData.submittedAt).toLocaleString() : new Date().toLocaleString(),
            'Created At': contactData.createdAt ? new Date(contactData.createdAt).toLocaleString() : new Date().toLocaleString()
        };

        const colWidths = [
            { wch: 25 }, // ID
            { wch: 20 }, // Name
            { wch: 30 }, // Email
            { wch: 15 }, // Phone
            { wch: 50 }, // Comment
            { wch: 12 }, // Status
            { wch: 20 }, // Submitted At
            { wch: 20 }  // Created At
        ];

        return await this._addRowToExcel(this.filePaths.contacts, 'Contacts', newRow, colWidths);
    }

    async addOrderToExcel(orderData) {
        const newRow = {
            'Order ID': orderData.orderId || orderData.id,
            'Customer Name': orderData.customerName,
            'Customer Email': orderData.customerEmail,
            'Customer Phone': orderData.customerPhone,
            'Product Name': orderData.productName,
            'Product SKU': orderData.productSku,
            'Quantity': orderData.quantity,
            'Unit Price': orderData.unitPrice,
            'Total Amount': orderData.totalAmount,
            'Payment Status': orderData.paymentStatus || 'pending',
            'Order Status': orderData.orderStatus || 'processing',
            'Shipping Address': orderData.shippingAddress,
            'Order Date': orderData.orderDate ? new Date(orderData.orderDate).toLocaleString() : new Date().toLocaleString(),
            'Created At': orderData.createdAt ? new Date(orderData.createdAt).toLocaleString() : new Date().toLocaleString()
        };

        const colWidths = [
            { wch: 20 }, // Order ID
            { wch: 20 }, // Customer Name
            { wch: 30 }, // Customer Email
            { wch: 15 }, // Customer Phone
            { wch: 30 }, // Product Name
            { wch: 15 }, // Product SKU
            { wch: 10 }, // Quantity
            { wch: 12 }, // Unit Price
            { wch: 12 }, // Total Amount
            { wch: 15 }, // Payment Status
            { wch: 12 }, // Order Status
            { wch: 40 }, // Shipping Address
            { wch: 20 }, // Order Date
            { wch: 20 }  // Created At
        ];

        return await this._addRowToExcel(this.filePaths.orders, 'Orders', newRow, colWidths);
    }

    async addProductToExcel(productData) {
        const newRow = {
            'Product ID': productData.id || productData._id,
            'Product Name': productData.name,
            'Description': productData.description,
            'Base Price': productData.basePrice,
            'Category': productData.category,
            'Gender': productData.gender,
            'Season': productData.season,
            'Collections': Array.isArray(productData.collections) ? productData.collections.join(', ') : productData.collections,
            'Tags': Array.isArray(productData.tags) ? productData.tags.join(', ') : productData.tags,
            'Variants Count': productData.variants ? productData.variants.length : 0,
            'Images Count': productData.images ? productData.images.length : 0,
            'Sales Count': productData.salesCount || 0,
            'Created At': productData.createdAt ? new Date(productData.createdAt).toLocaleString() : new Date().toLocaleString()
        };

        const colWidths = [
            { wch: 25 }, // Product ID
            { wch: 30 }, // Product Name
            { wch: 50 }, // Description
            { wch: 12 }, // Base Price
            { wch: 15 }, // Category
            { wch: 10 }, // Gender
            { wch: 12 }, // Season
            { wch: 30 }, // Collections
            { wch: 25 }, // Tags
            { wch: 12 }, // Variants Count
            { wch: 12 }, // Images Count
            { wch: 12 }, // Sales Count
            { wch: 20 }  // Created At
        ];

        return await this._addRowToExcel(this.filePaths.products, 'Products', newRow, colWidths);
    }

    async addSubscriberToExcel(subscriberData) {
        const newRow = {
            'ID': subscriberData.id || 'N/A',
            'Email': subscriberData.email,
            'Name': subscriberData.name || 'N/A',
            'Phone': subscriberData.phone || 'N/A',
            'Status': subscriberData.status || 'active',
            'Subscription Type': subscriberData.subscriptionType || 'general',
            'Subscribed At': subscriberData.subscribedAt ? new Date(subscriberData.subscribedAt).toLocaleString() : new Date().toLocaleString(),
            'Last Notified': subscriberData.lastNotified ? new Date(subscriberData.lastNotified).toLocaleString() : 'Never'
        };

        const colWidths = [
            { wch: 25 }, // ID
            { wch: 30 }, // Email
            { wch: 20 }, // Name
            { wch: 15 }, // Phone
            { wch: 12 }, // Status
            { wch: 18 }, // Subscription Type
            { wch: 20 }, // Subscribed At
            { wch: 20 }  // Last Notified
        ];

        return await this._addRowToExcel(this.filePaths.subscribers, 'Subscribers', newRow, colWidths);
    }

    async _addRowToExcel(filePath, sheetName, newRow, colWidths) {
        try {
            let workbook;
            let worksheet;

            // Check if file exists
            if (fs.existsSync(filePath)) {
                // Read existing file
                workbook = XLSX.readFile(filePath);
                worksheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
            } else {
                // Create new workbook
                workbook = XLSX.utils.book_new();
                worksheet = XLSX.utils.json_to_sheet([]);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            }

            // Convert worksheet to JSON to get existing data
            const existingData = XLSX.utils.sheet_to_json(worksheet);

            // Add new row to existing data
            existingData.push(newRow);

            // Create new worksheet with updated data
            const newWorksheet = XLSX.utils.json_to_sheet(existingData);

            // Set column widths
            newWorksheet['!cols'] = colWidths;

            // Replace the worksheet in workbook
            workbook.Sheets[sheetName] = newWorksheet;

            // Write to file
            XLSX.writeFile(workbook, filePath);

            return {
                success: true,
                message: `Data added to ${sheetName} Excel successfully`,
                filePath: filePath
            };
        } catch (error) {
            console.error('Excel Handler Error:', error);
            return {
                success: false,
                message: `Failed to add data to ${sheetName} Excel`,
                error: error.message
            };
        }
    }

    async exportData(type, data, customFilePath = null) {
        try {
            const timestamp = Date.now();
            const exportPath = customFilePath || `./storage/${type}_export_${timestamp}.xlsx`;
            
            let formattedData;
            let sheetName;

            switch (type) {
                case 'contacts':
                    formattedData = data.map(contact => ({
                        'ID': contact.id || 'N/A',
                        'Name': contact.name,
                        'Email': contact.email,
                        'Phone Number': contact.phoneNumber,
                        'Comment': contact.comment,
                        'Status': contact.status || 'pending',
                        'Submitted At': contact.submittedAt ? new Date(contact.submittedAt).toLocaleString() : 'N/A',
                        'Created At': contact.createdAt ? new Date(contact.createdAt).toLocaleString() : 'N/A'
                    }));
                    sheetName = 'Contacts';
                    break;

                case 'orders':
                    formattedData = data.map(order => ({
                        'Order ID': order.orderId || order.id,
                        'Customer Name': order.customerName,
                        'Customer Email': order.customerEmail,
                        'Product Name': order.productName,
                        'Quantity': order.quantity,
                        'Total Amount': order.totalAmount,
                        'Payment Status': order.paymentStatus || 'pending',
                        'Order Status': order.orderStatus || 'processing',
                        'Order Date': order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'
                    }));
                    sheetName = 'Orders';
                    break;

                case 'products':
                    formattedData = data.map(product => ({
                        'Product ID': product.id || product._id,
                        'Product Name': product.name,
                        'Description': product.description,
                        'Base Price': product.basePrice,
                        'Category': product.category,
                        'Gender': product.gender,
                        'Created At': product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'
                    }));
                    sheetName = 'Products';
                    break;

                default:
                    throw new Error('Invalid export type');
            }

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, exportPath);

            return {
                success: true,
                message: `${type} exported successfully`,
                filePath: exportPath
            };
        } catch (error) {
            console.error('Excel Export Error:', error);
            return {
                success: false,
                message: `Failed to export ${type}`,
                error: error.message
            };
        }
    }
}