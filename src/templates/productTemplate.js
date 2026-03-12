import { 
    calculatePriceRange, 
    formatPrice, 
    extractVariantValues, 
    getPrimaryImageUrl 
} from '../utils/emailUtils.js';

/**
 * Generates HTML template for product creation notifications
 * @param {Object} productData - Product data
 * @param {string} productUrl - Product URL
 * @param {string} placeholderImage - Placeholder image URL
 * @returns {string} HTML template string
 */
export const generateProductCreatedEmailTemplate = (productData, productUrl, placeholderImage) => {
    const primaryImage = getPrimaryImageUrl(
        productData.images, 
        productData.defaultImage, 
        placeholderImage
    );

    const variants = productData.variants || [];
    const variantColors = extractVariantValues(variants, 'color');
    const variantSizes = extractVariantValues(variants, 'size');
    const priceRange = calculatePriceRange(variants, productData.basePrice);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Product Alert</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .product-image { text-align: center; padding: 20px; background: #f8f9fa; }
            .product-image img { max-width: 100%; height: 300px; object-fit: cover; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .content { padding: 30px 20px; }
            .product-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .product-description { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .product-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; }
            .price { font-size: 24px; font-weight: bold; color: #e74c3c; text-align: center; margin: 20px 0; }
            .variants { margin: 20px 0; }
            .variant-section { margin-bottom: 15px; }
            .variant-label { font-weight: bold; color: #555; margin-bottom: 5px; }
            .variant-items { display: flex; flex-wrap: wrap; gap: 8px; }
            .variant-item { background: #007bff; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; }
            .cta-button { text-align: center; margin: 30px 0; }
            .cta-button a { 
                display: inline-block; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                text-decoration: none; 
                padding: 15px 30px; 
                border-radius: 25px; 
                font-weight: bold; 
                font-size: 16px;
                transition: transform 0.3s ease;
            }
            .cta-button a:hover { transform: translateY(-2px); }
            .footer { background: #333; color: white; padding: 20px; text-align: center; }
            .footer p { margin: 0; opacity: 0.8; }
            .unsubscribe { font-size: 12px; color: #ccc; margin-top: 10px; }
            .unsubscribe a { color: #ccc; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 New Product Alert!</h1>
                <p>Fresh arrivals just for you</p>
            </div>
            
            <div class="product-image">
                <img src="${primaryImage}" alt="${productData.name}" />
            </div>
            
            <div class="content">
                <div class="product-title">${productData.name}</div>
                <div class="product-description">${productData.description}</div>
                
                <div class="price">
                    ${formatPrice(priceRange)}
                </div>
                
                <div class="product-details">
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span class="detail-value">${productData.category}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Gender:</span>
                        <span class="detail-value">${productData.gender}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Season:</span>
                        <span class="detail-value">${productData.season}</span>
                    </div>
                    ${productData.collections && productData.collections.length > 0 ? `
                    <div class="detail-row">
                        <span class="detail-label">Collections:</span>
                        <span class="detail-value">${productData.collections.join(', ')}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${variants.length > 0 ? `
                <div class="variants">
                    ${variantColors.length > 0 ? `
                    <div class="variant-section">
                        <div class="variant-label">Available Colors:</div>
                        <div class="variant-items">
                            ${variantColors.map(color => `<span class="variant-item">${color}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${variantSizes.length > 0 ? `
                    <div class="variant-section">
                        <div class="variant-label">Available Sizes:</div>
                        <div class="variant-items">
                            ${variantSizes.map(size => `<span class="variant-item">${size}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="cta-button">
                    <a href="${productUrl}">View Product Details</a>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for subscribing to our product updates!</p>
                <div class="unsubscribe">
                    <a href="#unsubscribe">Unsubscribe from these emails</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generates plain text template for product creation notifications
 * @param {Object} productData - Product data  
 * @param {string} productUrl - Product URL
 * @returns {string} Plain text template string
 */
export const generateProductCreatedTextTemplate = (productData, productUrl) => {
    const variants = productData.variants || [];
    const variantColors = extractVariantValues(variants, 'color');
    const variantSizes = extractVariantValues(variants, 'size');
    const priceRange = calculatePriceRange(variants, productData.basePrice);

    return `
🎉 NEW PRODUCT ALERT!

${productData.name}

${productData.description}

💰 Price: ${formatPrice(priceRange)}

📂 Category: ${productData.category}
👤 Gender: ${productData.gender}
🌍 Season: ${productData.season}
${productData.collections && productData.collections.length > 0 ? `🏷️ Collections: ${productData.collections.join(', ')}` : ''}

${variantColors.length > 0 ? `🎨 Available Colors: ${variantColors.join(', ')}` : ''}
${variantSizes.length > 0 ? `📏 Available Sizes: ${variantSizes.join(', ')}` : ''}

🔗 View Product: ${productUrl}

Thank you for subscribing to our product updates!
    `;
};