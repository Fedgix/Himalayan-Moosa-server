import { cartService } from "../services/cart.service.js";
import { sendSuccess } from "../../../utils/response.handler.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";

export const cartController = {
    addToCart: async (req, res) => {
        const owner = req.owner;
        const { productId, variantId, quantity = 1 } = req.body;

        const cartItem = await cartService.addToCart(owner, productId, variantId, quantity);

        return sendSuccess(res, "Item added to cart successfully", { cartItem }, HttpStatusCode.CREATED);
    },

    getCart: async (req, res) => {
        const owner = req.owner;
        const cart = await cartService.getUserCart(owner);

        return sendSuccess(res, "Cart retrieved successfully", cart);
    },

    updateQuantity: async (req, res) => {
        const owner = req.owner;
        const { cartId } = req.params;
        const { quantity } = req.body;

        const updatedItem = await cartService.updateCartItemQuantity(cartId, owner, quantity);

        return sendSuccess(res, "Cart item quantity updated successfully", { cartItem: updatedItem });
    },

    removeItem: async (req, res) => {
        const { cartId } = req.params;
        const owner = req.owner;

        await cartService.removeCartItem(cartId, owner);

        return sendSuccess(res, "Item removed from cart successfully");
    },

    clearCart: async (req, res) => {
        const owner = req.owner;

        await cartService.clearUserCart(owner);

        return sendSuccess(res, "Cart cleared successfully");
    },

    incrementQuantity: async (req, res) => {
        const { cartId } = req.params;
        const owner = req.owner;

        const updatedItem = await cartService.incrementQuantity(cartId, owner);

        return sendSuccess(res, "Quantity incremented successfully", { cartItem: updatedItem });
    },

    decrementQuantity: async (req, res) => {
        const { cartId } = req.params;
        const owner = req.owner;

        const result = await cartService.decrementQuantity(cartId, owner);

        if (result) {
            return sendSuccess(res, "Quantity decremented successfully", { cartItem: result });
        }
        return sendSuccess(res, "Item removed from cart (quantity reached zero)");
    },
};
