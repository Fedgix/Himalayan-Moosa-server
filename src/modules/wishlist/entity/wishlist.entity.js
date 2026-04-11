import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

class WishlistEntity {
    constructor(data) {
        this.validateAndSetProperties(data);
    }

    validateAndSetProperties(data) {
        const { userId, guestId, productId, variantId, notes, priority, notifyOnStock, notifyOnPriceDrop } = data;

        this.validateOwner(userId, guestId);
        if (guestId != null && String(guestId).trim() !== "") {
            this.guestId = String(guestId).trim().slice(0, 128);
            this.userId = null;
        } else {
            this.userId = typeof userId === "string" ? userId : userId.toString();
            this.guestId = null;
        }

        // Validate and set productId
        this.validateProductId(productId);
        this.productId = typeof productId === 'string' ? productId : productId.toString();

        // Validate and set variantId (optional)
        this.validateVariantId(variantId);
        this.variantId = variantId ? (typeof variantId === 'string' ? variantId : variantId.toString()) : null;

        // Validate and set notes (optional)
        this.validateNotes(notes);
        this.notes = notes ? notes.trim() : null;

        // Validate and set priority
        this.validatePriority(priority);
        this.priority = priority || 'Medium';

        // Validate and set notification preferences
        this.validateNotificationPreferences(notifyOnStock, notifyOnPriceDrop);
        this.notifyOnStock = notifyOnStock !== undefined ? Boolean(notifyOnStock) : true;
        this.notifyOnPriceDrop = notifyOnPriceDrop !== undefined ? Boolean(notifyOnPriceDrop) : true;
    }

    validateOwner(userId, guestId) {
        const g = guestId != null ? String(guestId).trim() : "";
        if (g.length >= 8 && g.length <= 128) {
            return;
        }
        if (!userId) {
            throw new CustomError(
                "Sign in or provide guestId (or use X-Guest-Id for API).",
                HttpStatusCode.BAD_REQUEST
            );
        }
        let uid = userId;
        if (typeof uid !== "string") {
            uid = uid.toString();
        }
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(uid)) {
            throw new CustomError("Invalid user ID format", HttpStatusCode.BAD_REQUEST);
        }
    }

    validateProductId(productId) {
        if (!productId) {
            throw new CustomError(
                'Product ID is required',
                HttpStatusCode.BAD_REQUEST
            );
        }

        // If it's a populated object, it's valid
        if (typeof productId === 'object' && productId._id) {
            return;
        }

        // Convert to string if it's an ObjectId
        const productIdStr = typeof productId === 'string' ? productId : productId.toString();

        // Basic ObjectId format validation
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(productIdStr)) {
            throw new CustomError(
                'Invalid product ID format',
                HttpStatusCode.BAD_REQUEST
            );
        }
    }

    validateVariantId(variantId) {
        if (variantId !== undefined && variantId !== null) {
            // If it's a populated object, it's valid
            if (typeof variantId === 'object' && variantId._id) {
                return;
            }

            // Convert to string if it's an ObjectId
            const variantIdStr = typeof variantId === 'string' ? variantId : variantId.toString();

            if (variantIdStr.trim().length === 0) {
                throw new CustomError(
                    'Variant ID cannot be empty',
                    HttpStatusCode.BAD_REQUEST
                );
            }

            // Basic ObjectId format validation
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!objectIdRegex.test(variantIdStr)) {
                throw new CustomError(
                    'Invalid variant ID format',
                    HttpStatusCode.BAD_REQUEST
                );
            }
        }
    }

    validateSelectedVehicleId(selectedVehicleId) {
        if (selectedVehicleId !== undefined && selectedVehicleId !== null) {
            if (typeof selectedVehicleId !== 'string') {
                throw new CustomError(
                    'Selected vehicle ID must be a string',
                    HttpStatusCode.BAD_REQUEST
                );
            }

            // Basic ObjectId format validation
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!objectIdRegex.test(selectedVehicleId)) {
                throw new CustomError(
                    'Invalid selected vehicle ID format',
                    HttpStatusCode.BAD_REQUEST
                );
            }
        }
    }

    validateSelectedYear(selectedYear) {
        if (selectedYear !== undefined && selectedYear !== null) {
            if (typeof selectedYear !== 'number') {
                throw new CustomError(
                    'Selected year must be a number',
                    HttpStatusCode.BAD_REQUEST
                );
            }

            if (selectedYear < 1900 || selectedYear > 2030) {
                throw new CustomError(
                    'Selected year must be between 1900 and 2030',
                    HttpStatusCode.BAD_REQUEST
                );
            }
        }
    }

    validateNotes(notes) {
        if (notes !== undefined && notes !== null) {
            if (typeof notes !== 'string') {
                throw new CustomError(
                    'Notes must be a string',
                    HttpStatusCode.BAD_REQUEST
                );
            }

            if (notes.trim().length > 500) {
                throw new CustomError(
                    'Notes cannot exceed 500 characters',
                    HttpStatusCode.BAD_REQUEST
                );
            }
        }
    }

    validatePriority(priority) {
        if (priority !== undefined && priority !== null) {
            const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
            if (!validPriorities.includes(priority)) {
                throw new CustomError(
                    `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
                    HttpStatusCode.BAD_REQUEST
                );
            }
        }
    }

    validateNotificationPreferences(notifyOnStock, notifyOnPriceDrop) {
        if (notifyOnStock !== undefined && typeof notifyOnStock !== 'boolean') {
            throw new CustomError(
                'Notify on stock must be a boolean value',
                HttpStatusCode.BAD_REQUEST
            );
        }

        if (notifyOnPriceDrop !== undefined && typeof notifyOnPriceDrop !== 'boolean') {
            throw new CustomError(
                'Notify on price drop must be a boolean value',
                HttpStatusCode.BAD_REQUEST
            );
        }
    }

    // Method to get clean data for database operations
    toData() {
        const doc = {
            userId: this.userId,
            guestId: this.guestId,
            productId: this.productId,
            variantId: this.variantId,
            notes: this.notes,
            priority: this.priority,
            notifyOnStock: this.notifyOnStock,
            notifyOnPriceDrop: this.notifyOnPriceDrop,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
        if (doc.userId) {
            delete doc.guestId;
        } else {
            delete doc.userId;
        }
        return doc;
    }

    // Static method for update entity with partial data
    static createUpdateEntity(data) {
        const updateEntity = {};
        
        if (data.selectedVehicleId !== undefined) {
            const tempEntity = new WishlistEntity({ 
                userId: '507f1f77bcf86cd799439011', // dummy ID for validation
                productId: '507f1f77bcf86cd799439012', // dummy ID for validation
                selectedVehicleId: data.selectedVehicleId 
            });
            updateEntity.selectedVehicleId = tempEntity.selectedVehicleId;
        }

        if (data.selectedYear !== undefined) {
            const tempEntity = new WishlistEntity({ 
                userId: '507f1f77bcf86cd799439011', // dummy ID for validation
                productId: '507f1f77bcf86cd799439012', // dummy ID for validation
                selectedYear: data.selectedYear 
            });
            updateEntity.selectedYear = tempEntity.selectedYear;
        }

        if (data.notes !== undefined) {
            const tempEntity = new WishlistEntity({ 
                userId: '507f1f77bcf86cd799439011', // dummy ID for validation
                productId: '507f1f77bcf86cd799439012', // dummy ID for validation
                notes: data.notes 
            });
            updateEntity.notes = tempEntity.notes;
        }

        if (data.priority !== undefined) {
            const tempEntity = new WishlistEntity({ 
                userId: '507f1f77bcf86cd799439011', // dummy ID for validation
                productId: '507f1f77bcf86cd799439012', // dummy ID for validation
                priority: data.priority 
            });
            updateEntity.priority = tempEntity.priority;
        }

        if (data.notifyOnStock !== undefined) {
            const tempEntity = new WishlistEntity({ 
                userId: '507f1f77bcf86cd799439011', // dummy ID for validation
                productId: '507f1f77bcf86cd799439012', // dummy ID for validation
                notifyOnStock: data.notifyOnStock 
            });
            updateEntity.notifyOnStock = tempEntity.notifyOnStock;
        }

        if (data.notifyOnPriceDrop !== undefined) {
            const tempEntity = new WishlistEntity({ 
                userId: '507f1f77bcf86cd799439011', // dummy ID for validation
                productId: '507f1f77bcf86cd799439012', // dummy ID for validation
                notifyOnPriceDrop: data.notifyOnPriceDrop 
            });
            updateEntity.notifyOnPriceDrop = tempEntity.notifyOnPriceDrop;
        }

        return updateEntity;
    }

    // Static method to create entity from model
    static fromModel(wishlistModel) {
        if (!wishlistModel) return null;
        
        // Create entity with minimal data to avoid validation issues
        const entity = new WishlistEntity({
            userId: wishlistModel.userId ? wishlistModel.userId.toString() : null,
            guestId: wishlistModel.guestId || null,
            productId: wishlistModel.productId, // Keep as-is (could be populated object or ID)
            variantId: wishlistModel.variantId, // Keep as-is (could be populated object or ID)
            notes: wishlistModel.notes,
            priority: wishlistModel.priority,
            notifyOnStock: wishlistModel.notifyOnStock,
            notifyOnPriceDrop: wishlistModel.notifyOnPriceDrop
        });
        
        // Set additional properties that don't need validation
        entity.id = wishlistModel._id || wishlistModel.id;
        entity.createdAt = wishlistModel.createdAt;
        entity.updatedAt = wishlistModel.updatedAt;
        
        // Ensure populated objects are properly handled
        if (typeof wishlistModel.product === 'object' && wishlistModel.product !== null) {
            entity.product = wishlistModel.product;
        }
        if (typeof wishlistModel.variant === 'object' && wishlistModel.variant !== null) {
            entity.variant = wishlistModel.variant;
        }
        
        return entity;
    }

    // Static method to create entity list from model list
    static fromModelList(wishlistModels) {
        if (!Array.isArray(wishlistModels)) return [];
        return wishlistModels.map(wishlist => WishlistEntity.fromModel(wishlist));
    }
}

export default WishlistEntity; 