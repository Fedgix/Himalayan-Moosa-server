// checkout.repository.js - Fixed createOrder method

import mongoose from 'mongoose';
import Order from '../model/order.model.js'; 
// ProductVariant model removed - using new Product model structure
import Product from '../../product/models/product.model.js';
// ProductImage model removed - using new Product model structure
import { AddressModel } from '../../address/models/address.model.js';
import OrderEntity from '../entity/order.entity.js'; 
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js'; 

export const CheckoutRepository = {
    
    // validateAndEnrichItems: async (cartItems) => {
    //     if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    //         throw new CustomError('Cart items are required', HttpStatusCode.BAD_REQUEST, true);
    //     }

    //     const validatedItems = [];
        
    //     for (let i = 0; i < cartItems.length; i++) {
    //         const item = cartItems[i];
            
    //         if (!item.variantId || !item.quantity || item.quantity <= 0) {
    //             throw new CustomError(`Item at index ${i} is missing required fields`, HttpStatusCode.BAD_REQUEST, true);
    //         }

    //         // Get variant with product and image details
    //         const variant = await ProductVariant.findById(item.variantId).populate('productId');
    //         if (!variant) {
    //             throw new CustomError(`Product variant not found at index ${i}`, HttpStatusCode.NOT_FOUND, true);
    //         }

    //         if (!variant.isActive) {
    //             throw new CustomError(`Product variant at index ${i} is not available`, HttpStatusCode.BAD_REQUEST, true);
    //         }

    //         if (variant.stock < item.quantity) {
    //             throw new CustomError(`Insufficient stock for item at index ${i}. Available: ${variant.stock}, Requested: ${item.quantity}`, HttpStatusCode.BAD_REQUEST, true);
    //         }

    //         const product = variant.productId;
    //         const finalPrice = variant.discountPrice || variant.price || product.basePrice;
            
    //         // Get primary image for the product color
    //         const primaryImage = await ProductImage.findOne({ 
    //             productId: product._id, 
    //             color: variant.color, 
    //             isPrimary: true 
    //         });
            
    //         validatedItems.push({
    //             productId: product._id,
    //             variantId: variant._id,
    //             productName: product.name,
    //             productDescription: product.description,
    //             color: variant.color,
    //             colorCode: variant.colorCode,
    //             size: variant.size,
    //             sku: variant.sku,
    //             price: variant.price || product.basePrice,
    //             discountPrice: variant.discountPrice,
    //             quantity: item.quantity,
    //             itemTotal: finalPrice * item.quantity,
    //             availableStock: variant.stock,
    //             image: primaryImage ? primaryImage.imageUrl : product.defaultImage,
    //             category: product.category,
    //             gender: product.gender
    //         });
    //     }

    //     return validatedItems;
    // },

    validateAndEnrichItems: async (cartItems) => {
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            throw new CustomError('Cart items are required', HttpStatusCode.BAD_REQUEST, true);
        }
    
        const validatedItems = [];
        
        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                throw new CustomError(`Item at index ${i} is missing required fields`, HttpStatusCode.BAD_REQUEST, true);
            }
    
            // Get product details
            const product = await Product.findById(item.productId);
            if (!product) {
                throw new CustomError(`Product not found at index ${i}`, HttpStatusCode.NOT_FOUND, true);
            }
    
            if (!product.isActive) {
                throw new CustomError(`Product at index ${i} is not available`, HttpStatusCode.BAD_REQUEST, true);
            }
    
            if (product.inventory.stock < item.quantity) {
                throw new CustomError(`Insufficient stock for item at index ${i}. Available: ${product.inventory.stock}, Requested: ${item.quantity}`, HttpStatusCode.BAD_REQUEST, true);
            }
    
            const finalPrice = product.pricing.salePrice || product.pricing.originalPrice;
            
            // Handle variant if provided
            let variantData = null;
            if (item.variantId) {
                // Find variant in product's variants array
                const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
                if (variant) {
                    variantData = {
                        variantId: variant._id,
                        color: variant.attributes?.color || 'Default',
                        size: variant.attributes?.size || 'Standard'
                    };
                }
            }
            
            validatedItems.push({
                productId: product._id,
                variantId: variantData?.variantId || null,
                productName: product.name,
                productDescription: product.description,
                brand: product.brand || '',
                category: product.partType || 'General',
                sku: product.sku,
                color: variantData?.color || 'Default',
                colorCode: variantData?.colorCode || null,
                size: variantData?.size || 'Standard',
                price: product.pricing.originalPrice,
                discountPrice: product.pricing.salePrice,
                quantity: item.quantity,
                itemTotal: finalPrice * item.quantity,
                availableStock: product.inventory.stock,
                image: product.images.primary,
                gender: 'Unisex' // Default value for car parts
            });
        }
    
        console.log('Validated items:', validatedItems.map(item => ({
            sku: item.sku,
            productName: item.productName,
            image: item.image
        })));
    
        return validatedItems;
    },


    checkStockAvailability: async (productIdOrVariantId, requestedQuantity) => {
        // First try to find by productId
        let product = await Product.findById(productIdOrVariantId);
        
        // If not found, it might be a variantId, so find the product that contains this variant
        if (!product) {
            product = await Product.findOne({ variants: productIdOrVariantId });
        }
        
        if (!product) {
            throw new CustomError('Product not found', HttpStatusCode.NOT_FOUND, true);
        }

        // If it's a variant, check variant stock instead of product stock
        if (product.isVariant && product.variant) {
            // Variant is already loaded as a Product with isVariant: true
            return {
                available: product.inventory.stock >= requestedQuantity,
                availableStock: product.inventory.stock,
                isActive: product.isActive
            };
        }

        return {
            available: product.inventory.stock >= requestedQuantity,
            availableStock: product.inventory.stock,
            isActive: product.isActive
        };
    },

    validateCartItems: async (cartItems) => {
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            throw new CustomError('Cart items are required', HttpStatusCode.BAD_REQUEST, true);
        }

        const validatedItems = [];
        
        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                throw new CustomError(`Item at index ${i} is missing required fields`, HttpStatusCode.BAD_REQUEST, true);
            }

            // Re-validate stock at the time of order creation
            const product = await Product.findById(item.productId);
            if (!product) {
                throw new CustomError(`Product not found at index ${i}`, HttpStatusCode.NOT_FOUND, true);
            }

            if (!product.isActive) {
                throw new CustomError(`Product at index ${i} is not available`, HttpStatusCode.BAD_REQUEST, true);
            }

            if (product.inventory.stock < item.quantity) {
                throw new CustomError(`Insufficient stock for item at index ${i}. Available: ${product.inventory.stock}, Requested: ${item.quantity}`, HttpStatusCode.BAD_REQUEST, true);
            }

            const finalPrice = product.pricing.salePrice || product.pricing.originalPrice;
            
            validatedItems.push({
                productId: product._id,
                productName: product.name,
                sku: product.sku,
                price: product.pricing.originalPrice,
                discountPrice: product.pricing.salePrice,
                quantity: item.quantity,
                itemTotal: finalPrice * item.quantity,
                availableStock: product.inventory.stock
            });
        }

        return validatedItems;
    },

    getAddressByUserIdAndAddressId: async (userId, addressId) => {
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            throw new CustomError('Invalid address ID format', HttpStatusCode.BAD_REQUEST, true);
        }

        const address = await AddressModel.findOne({ 
            _id: addressId, 
            userId: userId 
        });

        if (!address) {
            throw new CustomError('Address not found or does not belong to user', HttpStatusCode.NOT_FOUND, true);
        }

        return address.toJSON();
    },

    createOrder: async (orderData) => {
        const session = await mongoose.startSession();
        
        try {
            let createdOrderEntity;
            
            await session.withTransaction(async () => {
                // Create order entity
                const orderEntity = new OrderEntity(orderData);
                orderEntity.generateOrderNumber();
                
                if (!orderEntity.isValid()) {
                    throw new CustomError('Invalid order data', HttpStatusCode.BAD_REQUEST, true);
                }
    
                // Final stock validation before order creation
                for (const item of orderData.items) {
                    const product = await Product.findById(item.productId, null, { session });
                    if (!product || product.inventory.stock < item.quantity) {
                        throw new CustomError(`Insufficient stock for item ${item.sku}`, HttpStatusCode.BAD_REQUEST, true);
                    }
                }
    
                // Create order in database
                const orderDoc = await Order.create([orderEntity.toDocument()], { session });
                const createdOrder = orderDoc[0];
    
                console.log('Order created successfully in transaction:', {
                    orderId: createdOrder._id,
                    orderNumber: createdOrder.orderNumber,
                    userId: createdOrder.userId,
                    totalAmount: createdOrder.totalAmount
                });
    
                // Store the OrderEntity to return after transaction
                createdOrderEntity = OrderEntity.fromDocument(createdOrder);
            });
    
            // Return the OrderEntity after successful transaction
            return createdOrderEntity;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        } finally {
            await session.endSession();
        }
    },

    // getOrderById: async (orderId) => {
    //     if (!mongoose.Types.ObjectId.isValid(orderId)) {
    //         throw new CustomError('Invalid order ID format', HttpStatusCode.BAD_REQUEST, true);
    //     }

    //     const order = await Order.findById(orderId);
    //     if (!order) {
    //         throw new CustomError('Order not found', HttpStatusCode.NOT_FOUND, true);
    //     }

    //     return OrderEntity.fromDocument(order);
    // },

    getOrderByRazorpayOrderId: async (razorpayOrderId) => {
        const order = await Order.findOne({ razorpayOrderId });
        if (!order) {
            throw new CustomError('Order not found with this Razorpay order ID', HttpStatusCode.NOT_FOUND, true);
        }

        return OrderEntity.fromDocument(order);
    },

    updateOrderPaymentStatus: async (orderId, paymentData) => {
        const session = await mongoose.startSession();
        
        try {
            return await session.withTransaction(async () => {
                const order = await Order.findById(orderId, null, { session });
                if (!order) {
                    throw new CustomError('Order not found', HttpStatusCode.NOT_FOUND, true);
                }

                // Update payment information
                order.paymentStatus = paymentData.paymentStatus;
                order.orderStatus = paymentData.orderStatus;
                order.razorpayPaymentId = paymentData.razorpayPaymentId;
                order.razorpaySignature = paymentData.razorpaySignature;

                // Handle stock reduction/restoration based on payment status
                if (paymentData.paymentStatus === 'paid' && order.paymentStatus === 'pending') {
                    // Payment successful - reduce stock
                    for (const item of order.items) {
                        const updateResult = await Product.findByIdAndUpdate(
                            item.productId,
                            { $inc: { 'inventory.stock': -item.quantity } },
                            { session, new: true }
                        );

                        if (!updateResult) {
                            throw new CustomError(`Failed to update stock for item ${item.sku}`, HttpStatusCode.INTERNAL_SERVER_ERROR, true);
                        }

                        if (updateResult.inventory.stock < 0) {
                            throw new CustomError(`Insufficient stock for item ${item.sku}`, HttpStatusCode.BAD_REQUEST, true);
                        }
                    }
                    
                    order.orderStatus = 'confirmed';
                } else if (paymentData.paymentStatus === 'failed' || paymentData.paymentStatus === 'cancelled') {
                    // Payment failed/cancelled - mark order as cancelled
                    order.orderStatus = 'cancelled';
                    order.cancelledAt = new Date();
                }

                await order.save({ session });
                return OrderEntity.fromDocument(order);
            });
        } finally {
            await session.endSession();
        }
    },

    // FIXED: updateOrderRazorpayId method
    updateOrderRazorpayId: async (orderId, razorpayOrderId) => {
        try {
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                { razorpayOrderId: razorpayOrderId },
                { new: true }
            );

            if (!updatedOrder) {
                throw new CustomError('Order not found for Razorpay ID update', HttpStatusCode.NOT_FOUND, true);
            }

            console.log('Order updated with Razorpay ID:', {
                orderId: updatedOrder._id,
                razorpayOrderId: updatedOrder.razorpayOrderId
            });

            return OrderEntity.fromDocument(updatedOrder);
        } catch (error) {
            console.error('Error updating order with Razorpay ID:', error);
            throw error;
        }
    },

    // getUserOrders: async (userId, options = {}) => {
    //     const { 
    //         page = 1, 
    //         limit = 10, 
    //         status, 
    //         paymentStatus 
    //     } = options;

    //     const matchConditions = { userId };
    //     if (status) matchConditions.orderStatus = status;
    //     if (paymentStatus) matchConditions.paymentStatus = paymentStatus;

    //     const skip = (page - 1) * limit;

    //     const [orders, totalCount] = await Promise.all([
    //         Order.find(matchConditions)
    //             .sort({ createdAt: -1 })
    //             .skip(skip)
    //             .limit(limit)
    //             .exec(),
    //         Order.countDocuments(matchConditions)
    //     ]);

    //     return {
    //         orders: orders.map(order => OrderEntity.fromDocument(order)),
    //         pagination: {
    //             total: totalCount,
    //             page,
    //             limit,
    //             pages: Math.ceil(totalCount / limit)
    //         }
    //     };
    // },

    getOrderById: async (orderId) => {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new CustomError('Invalid order ID format', HttpStatusCode.BAD_REQUEST, true);
        }
    
        const order = await Order.findById(orderId);
        if (!order) {
            throw new CustomError('Order not found', HttpStatusCode.NOT_FOUND, true);
        }
    
        // Enrich the order with current product images if missing
        const enrichedOrder = await CheckoutRepository.enrichOrderWithImages(order);
        
        return OrderEntity.fromDocument(enrichedOrder);
    },

    getUserOrders: async (userId, options = {}) => {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            paymentStatus 
        } = options;
    
        const matchConditions = { userId };
        if (status) matchConditions.orderStatus = status;
        if (paymentStatus) matchConditions.paymentStatus = paymentStatus;
    
        const skip = (page - 1) * limit;
    
        const [orders, totalCount] = await Promise.all([
            Order.find(matchConditions)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            Order.countDocuments(matchConditions)
        ]);
    
        // Enrich all orders with current product images
        const enrichedOrders = await Promise.all(
            orders.map(order => CheckoutRepository.enrichOrderWithImages(order))
        );
    
        return {
            orders: enrichedOrders.map(order => OrderEntity.fromDocument(order)),
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        };
    },

    enrichOrderWithImages: async (order) => {
        try {
            // Create a copy of the order to avoid modifying the original
            const enrichedOrder = order.toObject ? order.toObject() : order;
            
            // Enrich each item with current product image
            const enrichedItems = await Promise.all(
                enrichedOrder.items.map(async (item) => {
                    try {
                        // If image already exists and is valid, keep it
                        if (item.image && item.image.trim() !== '') {
                            return item;
                        }
                        
                        // Get current product info
                        const product = await Product.findById(item.productId);
                        
                        if (!product) {
                            console.warn(`Product not found for item: ${item.sku}`);
                            return item;
                        }
                        
                        // Return item with image
                        return {
                            ...item,
                            image: product.images.primary || null,
                            // Also ensure other fields are present
                            productName: item.productName || product.name,
                            productDescription: item.productDescription || product.description,
                            shortDescription: item.shortDescription || product.shortDescription,
                            categoryId: item.categoryId || product.categoryId
                        };
                    } catch (error) {
                        console.error(`Error enriching item ${item.sku}:`, error);
                        return item; // Return original item if enrichment fails
                    }
                })
            );
            
            // Return order with enriched items
            return {
                ...enrichedOrder,
                items: enrichedItems
            };
        } catch (error) {
            console.error('Error enriching order with images:', error);
            return order; // Return original order if enrichment fails
        }
    },

    
    calculateShippingFee: async (items, address) => {
        const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
        
        // Free shipping for orders above 999
        if (subtotal >= 999) {
            return 0;
        }
        
        // Standard shipping fee
        return 50;
    },

    calculateTax: async (items, address) => {
        // Simple tax calculation - 0% for now
        // Can be enhanced to calculate GST based on product category and address
        return 0;
    },

    // Method to cleanup expired checkout sessions (optional)
    cleanupExpiredSessions: async () => {
        // This would be implemented if using database storage for sessions
        // For now, it's handled in memory with TTL
    }
};

export default CheckoutRepository;