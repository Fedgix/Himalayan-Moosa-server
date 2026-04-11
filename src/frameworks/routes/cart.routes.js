import { Router } from "express";
import { cartController } from "../../modules/cart/controllers/cart.controller.js";
import catchAsync from "../middlewares/catch.async.js";
import { optionalAuthenticateToken, resolveUserOrGuest } from "../middlewares/auth.middleware.js";

const cartRouter = Router();
cartRouter.use(optionalAuthenticateToken);
cartRouter.use(resolveUserOrGuest);


// Add item to cart
cartRouter.post(
    "/", 
    catchAsync(cartController.addToCart)
);

// Get user's cart (with caching)
cartRouter.get(
    "/", 
    // cacheMiddleware(2 * 60 * 1000), // 2 minutes cache
    catchAsync(cartController.getCart)
);

// Update item quantity
cartRouter.put(
    "/:cartId/quantity", 
    catchAsync(cartController.updateQuantity)
);

// Increment quantity
cartRouter.patch(
    "/:cartId/increment", 
    catchAsync(cartController.incrementQuantity)
);

// Decrement quantity
cartRouter.patch(
    "/:cartId/decrement", 
    catchAsync(cartController.decrementQuantity)
);

// Remove item from cart
cartRouter.delete(
    "/:cartId", 
    catchAsync(cartController.removeItem)
);

// Clear entire cart
cartRouter.delete(
    "/", 
    catchAsync(cartController.clearCart)
);

export default cartRouter;