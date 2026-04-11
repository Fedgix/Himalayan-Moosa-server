import { isValidObjectId } from "mongoose";
import CustomError from "../../../utils/custom.error.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";

export class CartEntity {
    constructor(id = null, productId, variantId, userId, quantity = 1) {
        this.id = id;
        this.productId = productId;
        this.variantId = variantId;
        this.userId = userId;
        this.quantity = quantity;

        this.validate();
    }

    toDocument(doc = {}) {
        doc.productId = this.productId;
        doc.variantId = this.variantId === undefined ? null : this.variantId;
        doc.userId = this.userId;
        doc.quantity = this.quantity;

        if (this.id) {
            doc._id = this.id;
        }

        return doc;
    }

    validate() {
        this._normalizeOptionalIds();
        this._validateProductId();
        this._validateVariantId();
        this._validateUserId();
        this._validateQuantity();
    }

    /** Empty string from JSON must become null before Mongoose save (avoids invalid ObjectId cast). */
    _normalizeOptionalIds() {
        if (this.variantId === undefined || this.variantId === null) {
            this.variantId = null;
            return;
        }
        if (typeof this.variantId === "string" && this.variantId.trim() === "") {
            this.variantId = null;
        }
    }

    _validateId(id) { 
        if (!id) return false;
        return isValidObjectId(id);
    }

    _validateProductId() {
        if (!this.productId || 
            (typeof this.productId === 'string' && this.productId.trim().length === 0) || 
            !this._validateId(this.productId)) {
            throw new CustomError("Provide a valid productID", HttpStatusCode.BAD_REQUEST, true);
        }
    }

    _validateVariantId() {
        if (this.variantId === null || this.variantId === undefined) {
            return;
        }
        if (!this._validateId(this.variantId)) {
            throw new CustomError(
                "The selected product option is not valid. Pick a valid option or refresh the page.",
                HttpStatusCode.BAD_REQUEST,
                true
            );
        }
    }

    _validateUserId() {
        if (!this.userId || 
            (typeof this.userId === 'string' && this.userId.trim().length === 0) || 
            !this._validateId(this.userId)) {
            throw new CustomError("Provide a valid userId", HttpStatusCode.BAD_REQUEST, true);
        }
    }

    _validateQuantity() {
        const qty = typeof this.quantity === 'string' ? parseInt(this.quantity, 10) : this.quantity;
        
        if (isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
            throw new CustomError("Provide a valid quantity (positive integer)", HttpStatusCode.BAD_REQUEST, true);
        }
        
        this.quantity = qty;
    }
}