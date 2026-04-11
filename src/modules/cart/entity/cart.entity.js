import { isValidObjectId } from "mongoose";
import CustomError from "../../../utils/custom.error.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";

export class CartEntity {
    /**
     * @param {string|null} id
     * @param {string} productId
     * @param {string|null} variantId
     * @param {{ userId?: import("mongoose").Types.ObjectId | null, guestId?: string | null }} owner
     * @param {number} quantity
     */
    constructor(id = null, productId, variantId, owner, quantity = 1) {
        this.id = id;
        this.productId = productId;
        this.variantId = variantId;
        this.owner = owner || {};
        this.quantity = quantity;

        this.validate();
    }

    toDocument(doc = {}) {
        doc.productId = this.productId;
        doc.variantId = this.variantId === undefined ? null : this.variantId;
        doc.quantity = this.quantity;

        if (this.owner.userId) {
            doc.userId = this.owner.userId;
            doc.guestId = undefined;
        } else if (this.owner.guestId) {
            doc.userId = undefined;
            doc.guestId = this.owner.guestId;
        }

        if (this.id) {
            doc._id = this.id;
        }

        return doc;
    }

    validate() {
        this._normalizeOptionalIds();
        this._validateProductId();
        this._validateVariantId();
        this._validateOwner();
        this._validateQuantity();
    }

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
        if (
            !this.productId ||
            (typeof this.productId === "string" && this.productId.trim().length === 0) ||
            !this._validateId(this.productId)
        ) {
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

    _validateOwner() {
        const { userId, guestId } = this.owner || {};
        if (userId != null && this._validateId(userId)) {
            return;
        }
        if (guestId != null && typeof guestId === "string") {
            const g = guestId.trim();
            if (g.length >= 8 && g.length <= 128) {
                return;
            }
        }
        throw new CustomError(
            "Provide a valid user session or guest id (X-Guest-Id).",
            HttpStatusCode.BAD_REQUEST,
            true
        );
    }

    _validateQuantity() {
        const qty = typeof this.quantity === "string" ? parseInt(this.quantity, 10) : this.quantity;

        if (isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
            throw new CustomError("Provide a valid quantity (positive integer)", HttpStatusCode.BAD_REQUEST, true);
        }

        this.quantity = qty;
    }
}
