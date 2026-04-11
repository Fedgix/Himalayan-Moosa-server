import mongoose from "mongoose";
import Cart from "../model/cart.model.js";
import CustomError from "../../../utils/custom.error.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";
import { ownerQuery } from "../../../utils/cartWishlistOwner.js";

const cartRepository = {
    async create(cartData) {
        return await Cart.create(cartData);
    },

    async findByUserProductVariant(owner, productId, variantId) {
        const query = { ...ownerQuery(owner), productId };
        if (variantId) {
            query.variantId = variantId;
        } else {
            query.variantId = null;
        }
        return await Cart.findOne(query);
    },

    async findByOwner(owner) {
        return await Cart.find({ ...ownerQuery(owner) })
            .populate({
                path: "product",
                select: "name description pricing images category brand sku isActive inventory",
            })
            .populate({
                path: "variant",
                select: "name sku pricing images attributes inventory isActive isDefault",
            })
            .sort({ createdAt: -1 });
    },

    async findById(cartId) {
        return await Cart.findById(cartId)
            .populate({
                path: "product",
                select: "name description pricing images category brand sku isActive",
            })
            .populate({
                path: "variant",
                select: "name sku pricing images attributes inventory isActive isDefault",
            });
    },

    async updateQuantity(cartId, quantity) {
        return await Cart.findByIdAndUpdate(cartId, { quantity }, { new: true, runValidators: true });
    },

    async deleteById(cartId) {
        return await Cart.findByIdAndDelete(cartId);
    },

    async deleteByOwner(owner) {
        return await Cart.deleteMany({ ...ownerQuery(owner) });
    },

    async getCartCount(owner) {
        return await Cart.countDocuments({ ...ownerQuery(owner) });
    },

    async getCartTotal(owner) {
        const match = { ...ownerQuery(owner) };
        const result = await Cart.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $lookup: {
                    from: "productvariants",
                    localField: "variantId",
                    foreignField: "_id",
                    as: "variant",
                },
            },
            { $unwind: "$product" },
            {
                $addFields: {
                    itemTotal: {
                        $multiply: [
                            "$quantity",
                            {
                                $cond: {
                                    if: { $gt: [{ $size: "$variant" }, 0] },
                                    then: {
                                        $ifNull: [
                                            { $arrayElemAt: ["$variant.pricing.salePrice", 0] },
                                            { $arrayElemAt: ["$variant.pricing.originalPrice", 0] },
                                        ],
                                    },
                                    else: {
                                        $ifNull: ["$product.pricing.salePrice", "$product.pricing.originalPrice"],
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$itemTotal" },
                    totalItems: { $sum: "$quantity" },
                },
            },
        ]);

        return result.length > 0 ? result[0] : { totalAmount: 0, totalItems: 0 };
    },

    async deleteByUserIdAndVariantIds(userId, variantIds) {
        try {
            return await Cart.deleteMany({
                userId: userId,
                variantId: { $in: variantIds },
            });
        } catch (error) {
            console.error("Error deleting cart items by variant IDs:", error);
            throw error;
        }
    },

    async findByUserIdAndVariantIds(userId, variantIds) {
        try {
            return await Cart.find({
                userId: userId,
                variantId: { $in: variantIds },
            }).populate("product variant");
        } catch (error) {
            console.error("Error finding cart items by variant IDs:", error);
            throw error;
        }
    },

    clearCartItemsAfterPayment: async (userId, variantIds) => {
        try {
            console.log("Clearing cart items for variants:", variantIds);

            const cartItemsToRemove = await cartRepository.findByUserIdAndVariantIds(userId, variantIds);

            const result = await cartRepository.deleteByUserIdAndVariantIds(userId, variantIds);

            console.log(`Successfully removed ${result.deletedCount} items from cart`);

            return {
                success: true,
                itemsRemoved: result.deletedCount,
                removedItems: cartItemsToRemove.map((item) => ({
                    cartItemId: item._id,
                    variantId: item.variantId?._id,
                    productName: item.productId?.name,
                    quantity: item.quantity,
                })),
            };
        } catch (error) {
            console.error("Error clearing cart items after payment:", error);
            throw error;
        }
    },
};

export default cartRepository;
