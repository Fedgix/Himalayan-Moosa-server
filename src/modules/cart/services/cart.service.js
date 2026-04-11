import cartRepository from "../repository/cart.repository.js";
import { CartEntity } from "../entity/cart.entity.js";
import CustomError from "../../../utils/custom.error.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";
import Product from "../../product/models/product.model.js";
import { itemBelongsToOwner } from "../../../utils/cartWishlistOwner.js";

/** Treat "", whitespace, null, undefined as "no variant" (simple products). */
function normalizeOptionalVariantId(variantId) {
    if (variantId === undefined || variantId === null) return null;
    const s = String(variantId).trim();
    return s === "" ? null : s;
}

function normalizeOwner(owner) {
    if (!owner) return null;
    if (owner.userId) {
        return { userId: owner.userId, guestId: null };
    }
    if (owner.guestId) {
        return { userId: null, guestId: owner.guestId };
    }
    return null;
}

export const cartService = {
    async addToCart(owner, productId, variantId, quantity = 1) {
        owner = normalizeOwner(owner);
        variantId = normalizeOptionalVariantId(variantId);

        const product = await Product.findById(productId);
        if (!product) {
            throw new CustomError("Product not found", HttpStatusCode.NOT_FOUND, true);
        }

        if (!product.isActive) {
            throw new CustomError("Product is not active", HttpStatusCode.BAD_REQUEST, true);
        }

        let variant = null;
        let stock = product.inventory?.stock || 0;

        if (variantId) {
            variant = await Product.findOne({
                _id: variantId,
                isVariant: true,
                variant: productId,
                isActive: true,
            });
            if (!variant) {
                throw new CustomError("Product variant not found or inactive", HttpStatusCode.NOT_FOUND, true);
            }
            stock = variant.inventory?.stock || 0;
        }

        if (stock < quantity) {
            throw new CustomError(`Insufficient stock. Only ${stock} items available`, HttpStatusCode.BAD_REQUEST, true);
        }

        const existingCartItem = await cartRepository.findByUserProductVariant(owner, productId, variantId);

        if (existingCartItem) {
            const newQuantity = existingCartItem.quantity + quantity;

            if (newQuantity > stock) {
                throw new CustomError(`Cannot add more items. Maximum available: ${stock}`, HttpStatusCode.BAD_REQUEST, true);
            }

            return await cartRepository.updateQuantity(existingCartItem._id, newQuantity);
        }

        const cartEntity = new CartEntity(null, productId, variantId, owner, quantity);
        return await cartRepository.create(cartEntity.toDocument());
    },

    async getUserCart(owner) {
        owner = normalizeOwner(owner);
        const cartItems = await cartRepository.findByOwner(owner);
        const cartTotal = await cartRepository.getCartTotal(owner);

        const itemsWithStock = cartItems.map((item) => {
            const itemObj = item.toObject ? item.toObject() : item;

            if (itemObj.product) {
                itemObj.product.stock = itemObj.product.inventory?.stock || 0;
            }
            if (itemObj.variant) {
                itemObj.variant.stock = itemObj.variant.inventory?.stock || 0;
            }

            return itemObj;
        });

        return {
            items: itemsWithStock,
            summary: {
                totalItems: cartTotal.totalItems,
                totalAmount: cartTotal.totalAmount,
                itemCount: itemsWithStock.length,
            },
        };
    },

    async updateCartItemQuantity(cartId, owner, quantity) {
        owner = normalizeOwner(owner);
        const cartItem = await cartRepository.findById(cartId);

        if (!cartItem) {
            throw new CustomError("Cart item not found", HttpStatusCode.NOT_FOUND, true);
        }

        if (!itemBelongsToOwner(cartItem, owner)) {
            throw new CustomError("Unauthorized access to cart item", HttpStatusCode.FORBIDDEN, true);
        }

        if (cartItem.variant) {
            if (!cartItem.variant.isActive) {
                throw new CustomError("Product variant is no longer available", HttpStatusCode.BAD_REQUEST, true);
            }
            if (cartItem.variant.inventory?.stock < quantity) {
                throw new CustomError(
                    `Insufficient stock. Only ${cartItem.variant.inventory.stock} items available`,
                    HttpStatusCode.BAD_REQUEST,
                    true
                );
            }
        } else if (cartItem.product) {
            if (!cartItem.product.isActive) {
                throw new CustomError("Product is no longer available", HttpStatusCode.BAD_REQUEST, true);
            }
            if (cartItem.product.inventory?.stock < quantity) {
                throw new CustomError(
                    `Insufficient stock. Only ${cartItem.product.inventory.stock} items available`,
                    HttpStatusCode.BAD_REQUEST,
                    true
                );
            }
        }

        return await cartRepository.updateQuantity(cartId, quantity);
    },

    async removeCartItem(cartId, owner) {
        owner = normalizeOwner(owner);
        const cartItem = await cartRepository.findById(cartId);

        if (!cartItem) {
            throw new CustomError("Cart item not found", HttpStatusCode.NOT_FOUND, true);
        }

        if (!itemBelongsToOwner(cartItem, owner)) {
            throw new CustomError("Unauthorized access to cart item", HttpStatusCode.FORBIDDEN, true);
        }

        return await cartRepository.deleteById(cartId);
    },

    async clearUserCart(owner) {
        owner = normalizeOwner(owner);
        return await cartRepository.deleteByOwner(owner);
    },

    async incrementQuantity(cartId, owner) {
        owner = normalizeOwner(owner);
        const cartItem = await cartRepository.findById(cartId);

        if (!cartItem) {
            throw new CustomError("Cart item not found", HttpStatusCode.NOT_FOUND, true);
        }

        if (!itemBelongsToOwner(cartItem, owner)) {
            throw new CustomError("Unauthorized access to cart item", HttpStatusCode.FORBIDDEN, true);
        }

        const newQuantity = cartItem.quantity + 1;

        if (cartItem.variant) {
            if (!cartItem.variant.isActive) {
                throw new CustomError("Product variant is no longer available", HttpStatusCode.BAD_REQUEST, true);
            }
            if (cartItem.variant.inventory?.stock < newQuantity) {
                throw new CustomError(
                    `Cannot increase quantity. Only ${cartItem.variant.inventory.stock} items available`,
                    HttpStatusCode.BAD_REQUEST,
                    true
                );
            }
        } else if (cartItem.product) {
            if (!cartItem.product.isActive) {
                throw new CustomError("Product is no longer available", HttpStatusCode.BAD_REQUEST, true);
            }
            if (cartItem.product.inventory?.stock < newQuantity) {
                throw new CustomError(
                    `Cannot increase quantity. Only ${cartItem.product.inventory.stock} items available`,
                    HttpStatusCode.BAD_REQUEST,
                    true
                );
            }
        }

        return await cartRepository.updateQuantity(cartId, newQuantity);
    },

    async decrementQuantity(cartId, owner) {
        owner = normalizeOwner(owner);
        const cartItem = await cartRepository.findById(cartId);

        if (!cartItem) {
            throw new CustomError("Cart item not found", HttpStatusCode.NOT_FOUND, true);
        }

        if (!itemBelongsToOwner(cartItem, owner)) {
            throw new CustomError("Unauthorized access to cart item", HttpStatusCode.FORBIDDEN, true);
        }

        const newQuantity = cartItem.quantity - 1;

        if (newQuantity < 1) {
            return await cartRepository.deleteById(cartId);
        }

        return await cartRepository.updateQuantity(cartId, newQuantity);
    },
};
