import cartRepository from "../repository/cart.repository.js";
import { CartEntity } from "../entity/cart.entity.js";
import CustomError from "../../../utils/custom.error.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";
import Product from "../../product/models/product.model.js";

export const cartService = {
    async addToCart(userId, productId, variantId, quantity = 1) {
        // Validate product exists and is active
        const product = await Product.findById(productId);
        if (!product) {
            throw new CustomError("Product not found", HttpStatusCode.NOT_FOUND, true);
        }

        if (!product.isActive) {
            throw new CustomError("Product is not active", HttpStatusCode.BAD_REQUEST, true);
        }

        let variant = null;
        let stock = product.inventory?.stock || 0;

        // If variantId is provided, validate variant
        if (variantId) {
            variant = await Product.findOne({ 
                _id: variantId, 
                isVariant: true,
                variant: productId,
                isActive: true 
            });
            if (!variant) {
                throw new CustomError("Product variant not found or inactive", HttpStatusCode.NOT_FOUND, true);
            }
            stock = variant.inventory?.stock || 0;
        }

        // Check if there's sufficient stock
        if (stock < quantity) {
            throw new CustomError(`Insufficient stock. Only ${stock} items available`, HttpStatusCode.BAD_REQUEST, true);
        }

        // Check if item already exists in cart
        const existingCartItem = await cartRepository.findByUserProductVariant(userId, productId, variantId);
        
        if (existingCartItem) {
            // Update quantity if item exists
            const newQuantity = existingCartItem.quantity + quantity;
            
            if (newQuantity > stock) {
                throw new CustomError(`Cannot add more items. Maximum available: ${stock}`, HttpStatusCode.BAD_REQUEST, true);
            }

            return await cartRepository.updateQuantity(existingCartItem._id, newQuantity);
        } else {
            // Create new cart item
            const cartEntity = new CartEntity(null, productId, variantId, userId, quantity);
            return await cartRepository.create(cartEntity.toDocument());
        }
    },

    async getUserCart(userId) {
        const cartItems = await cartRepository.findByUserId(userId);
        const cartTotal = await cartRepository.getCartTotal(userId);
        console.log("cartItems: ",cartItems, "Cart total: ", cartTotal)
        
        // Add stock field to each cart item's product
        const itemsWithStock = cartItems.map(item => {
            const itemObj = item.toObject ? item.toObject() : item;
            
            // Add stock field to product
            if (itemObj.product) {
                itemObj.product.stock = itemObj.product.inventory?.stock || 0;
            }
            
            // Add stock field to variant if it exists
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
                itemCount: itemsWithStock.length
            }
        };
    },

    async updateCartItemQuantity(cartId, userId, quantity) {
        const cartItem = await cartRepository.findById(cartId);
        
        if (!cartItem) {
            throw new CustomError("Cart item not found", HttpStatusCode.NOT_FOUND, true);
        }

        // Verify cart item belongs to the user
        if (cartItem.userId.toString() !== userId.toString()) {
            throw new CustomError("Unauthorized access to cart item", HttpStatusCode.FORBIDDEN, true);
        }

        // Check stock - handle both product-only and variant cases
        if (cartItem.variant) {
            // Product with variant
            if (!cartItem.variant.isActive) {
                throw new CustomError("Product variant is no longer available", HttpStatusCode.BAD_REQUEST, true);
            }
            if (cartItem.variant.inventory?.stock < quantity) {
                throw new CustomError(`Insufficient stock. Only ${cartItem.variant.inventory.stock} items available`, HttpStatusCode.BAD_REQUEST, true);
            }
        } else if (cartItem.product) {
            // Product without variant
            if (!cartItem.product.isActive) {
                throw new CustomError("Product is no longer available", HttpStatusCode.BAD_REQUEST, true);
            }
            if (cartItem.product.inventory?.stock < quantity) {
                throw new CustomError(`Insufficient stock. Only ${cartItem.product.inventory.stock} items available`, HttpStatusCode.BAD_REQUEST, true);
            }
        }

        const cartEntity = new CartEntity(cartId, cartItem.productId, cartItem.variantId, userId, quantity);
        return await cartRepository.updateQuantity(cartId, quantity);
    },

    async removeCartItem(cartId, userId) {
        const cartItem = await cartRepository.findById(cartId);
        
        if (!cartItem) {
            throw new CustomError("Cart item not found", HttpStatusCode.NOT_FOUND, true);
        }

        // Verify cart item belongs to the user
        if (cartItem.userId.toString() !== userId.toString()) {
            throw new CustomError("Unauthorized access to cart item", HttpStatusCode.FORBIDDEN, true);
        }

        return await cartRepository.deleteById(cartId);
    },

    async clearUserCart(userId) {
        return await cartRepository.deleteByUserId(userId);
    },

    async incrementQuantity(cartId, userId) {
        const cartItem = await cartRepository.findById(cartId);
        
        if (!cartItem) {
            throw new CustomError("Cart item not found", HttpStatusCode.NOT_FOUND, true);
        }

        if (cartItem.userId.toString() !== userId.toString()) {
            throw new CustomError("Unauthorized access to cart item", HttpStatusCode.FORBIDDEN, true);
        }

        const newQuantity = cartItem.quantity + 1;
        
        // Check stock - handle both product-only and variant cases
        if (cartItem.variant) {
            // Product with variant
            if (!cartItem.variant.isActive) {
                throw new CustomError("Product variant is no longer available", HttpStatusCode.BAD_REQUEST, true);
            }
            if (cartItem.variant.inventory?.stock < newQuantity) {
                throw new CustomError(`Cannot increase quantity. Only ${cartItem.variant.inventory.stock} items available`, HttpStatusCode.BAD_REQUEST, true);
            }
        } else if (cartItem.product) {
            // Product without variant
            if (!cartItem.product.isActive) {
                throw new CustomError("Product is no longer available", HttpStatusCode.BAD_REQUEST, true);
            }
            if (cartItem.product.inventory?.stock < newQuantity) {
                throw new CustomError(`Cannot increase quantity. Only ${cartItem.product.inventory.stock} items available`, HttpStatusCode.BAD_REQUEST, true);
            }
        }

        return await cartRepository.updateQuantity(cartId, newQuantity);
    },

    async decrementQuantity(cartId, userId) {
        const cartItem = await cartRepository.findById(cartId);
        
        if (!cartItem) {
            throw new CustomError("Cart item not found", HttpStatusCode.NOT_FOUND, true);
        }

        if (cartItem.userId.toString() !== userId.toString()) {
            throw new CustomError("Unauthorized access to cart item", HttpStatusCode.FORBIDDEN, true);
        }

        const newQuantity = cartItem.quantity - 1;
        
        if (newQuantity < 1) {
            // Remove item if quantity becomes 0
            return await cartRepository.deleteById(cartId);
        }

        return await cartRepository.updateQuantity(cartId, newQuantity);
    }
};