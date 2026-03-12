import { cartService } from "../services/cart.service.js";
import { sendSuccess } from "../../../utils/response.handler.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";

export const cartController = {
    addToCart: async (req, res) => {
        const userId = req.user.id;
        const { productId, variantId, quantity = 1 } = req.body;
        
        const cartItem = await cartService.addToCart(userId, productId, variantId, quantity);
        
        return sendSuccess(
            res, 
            "Item added to cart successfully", 
            { cartItem }, 
            HttpStatusCode.CREATED
        );
    },

    getCart: async (req, res) => {
        const userId = req.user.id;
        console.log("userId: ",userId)
        const cart = await cartService.getUserCart(userId);
        
        return sendSuccess(
            res, 
            "Cart retrieved successfully", 
            cart
        );
    },

    updateQuantity: async (req, res) => {
        const userId = req.user.id;
        const { cartId } = req.params;
        const { quantity } = req.body;
        // const {userId} = req.user.id;
        
        const updatedItem = await cartService.updateCartItemQuantity(cartId, userId, quantity);
        
        return sendSuccess(
            res, 
            "Cart item quantity updated successfully", 
            { cartItem: updatedItem }
        );
    },

    removeItem: async (req, res) => {
        const { cartId } = req.params;
        const userId = req.user.id;
        console.log("UserId: 1",req.body)
        // const userId = req.user.id;
        
        await cartService.removeCartItem(cartId, userId);
        
        return sendSuccess(
            res, 
            "Item removed from cart successfully"
        );
    },

    clearCart: async (req, res) => {
        // const userId = req.user.id;
        const userId = req.user.id;
        console.log("UserId: ",req.body)

        await cartService.clearUserCart(userId);
        
        return sendSuccess(
            res, 
            "Cart cleared successfully"
        );
    },

    incrementQuantity: async (req, res) => {
        const { cartId } = req.params;
        // const userId = req.user.id;
        const userId = req.user.id;

        const updatedItem = await cartService.incrementQuantity(cartId, userId);
        
        return sendSuccess(
            res, 
            "Quantity incremented successfully", 
            { cartItem: updatedItem }
        );
    },

    decrementQuantity: async (req, res) => {
        const { cartId } = req.params;
        // const userId = req.user.id;
        const userId = req.user.id;

        const result = await cartService.decrementQuantity(cartId, userId);
        
        if (result) {
            return sendSuccess(
                res, 
                "Quantity decremented successfully", 
                { cartItem: result }
            );
        } else {
            return sendSuccess(
                res, 
                "Item removed from cart (quantity reached zero)"
            );
        }
    }
};
