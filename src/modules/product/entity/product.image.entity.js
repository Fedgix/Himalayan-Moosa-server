import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

class ProductImageEntity {
    constructor(data) {
        this.id = data.id || null;
        this.productId = data.productId;
        this.imageUrl = data.imageUrl;
        this.altText = data.altText || '';
        this.caption = data.caption || '';
        this.isPrimary = data.isPrimary || false;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.sortOrder = data.sortOrder || 0;
        this.metadata = data.metadata || {};
        
        this.validate();
    }

    validate() {
        // Required fields validation
        if (!this.productId) {
            throw new CustomError(
                'Product ID is required for product image',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        if (!this.imageUrl) {
            throw new CustomError(
                'Image URL is required for product image',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        // URL format validation
        if (!this.isValidUrl(this.imageUrl)) {
            throw new CustomError(
                'Invalid image URL format',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        // Alt text length validation
        if (this.altText && this.altText.length > 255) {
            throw new CustomError(
                'Alt text cannot exceed 255 characters',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        // Caption length validation
        if (this.caption && this.caption.length > 500) {
            throw new CustomError(
                'Caption cannot exceed 500 characters',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }

        // Sort order validation
        if (this.sortOrder < 0) {
            throw new CustomError(
                'Sort order cannot be negative',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    toDocument() {
        return {
            productId: this.productId,
            imageUrl: this.imageUrl,
            altText: this.altText,
            caption: this.caption,
            isPrimary: this.isPrimary,
            isActive: this.isActive,
            sortOrder: this.sortOrder,
            metadata: this.metadata
        };
    }

    static fromDocument(doc) {
        return new ProductImageEntity({
            id: doc._id?.toString(),
            productId: doc.productId,
            imageUrl: doc.imageUrl,
            altText: doc.altText,
            caption: doc.caption,
            isPrimary: doc.isPrimary,
            isActive: doc.isActive,
            sortOrder: doc.sortOrder,
            metadata: doc.metadata
        });
    }

    // Business logic methods
    setAsPrimary() {
        this.isPrimary = true;
        this.sortOrder = 0;
    }

    setAsSecondary() {
        this.isPrimary = false;
    }

    updateSortOrder(newOrder) {
        if (newOrder < 0) {
            throw new CustomError(
                'Sort order cannot be negative',
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }
        this.sortOrder = newOrder;
    }

    isImageActive() {
        return this.isActive;
    }

    getImageInfo() {
        return {
            id: this.id,
            imageUrl: this.imageUrl,
            altText: this.altText,
            caption: this.caption,
            isPrimary: this.isPrimary,
            sortOrder: this.sortOrder
        };
    }
}

export default ProductImageEntity; 