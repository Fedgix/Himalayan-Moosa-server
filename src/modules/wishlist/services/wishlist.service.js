import WishlistRepository from '../repository/wishlist.repository.js';
import WishlistEntity from '../entity/wishlist.entity.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

class WishlistService {
    constructor() {
        this.wishlistRepository = new WishlistRepository();
    }

    async addToWishlist(wishlistData) {
        try {
            // Check if item already exists in user's wishlist (with variant support)
            const existingItem = await this.wishlistRepository.findByUserProductVariant(
                wishlistData.userId, 
                wishlistData.productId,
                wishlistData.variantId || null
            );

            if (existingItem) {
                throw new CustomError('Product already exists in wishlist', HttpStatusCode.CONFLICT, true);
            }

            const wishlistEntity = new WishlistEntity(wishlistData);
            const wishlist = await this.wishlistRepository.create(wishlistEntity.toData());
            
            return {
                success: true,
                data: wishlist,
                message: 'Product variant added to wishlist successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getWishlistByUser(userId, filters = {}) {
        try {
            const wishlistItems = await this.wishlistRepository.findByUser(userId, filters);
            
            // Convert entities to plain objects to ensure proper JSON serialization
            const plainWishlistItems = wishlistItems.map(item => {
                const plainItem = {
                    id: item.id,
                    userId: item.userId,
                    productId: item.productId,
                    variantId: item.variantId,
                    product: item.product,
                    variant: item.variant,
                    notes: item.notes,
                    priority: item.priority,
                    notifyOnStock: item.notifyOnStock,
                    notifyOnPriceDrop: item.notifyOnPriceDrop,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                };
                return plainItem;
            });
            
            return {
                success: true,
                data: plainWishlistItems,
                message: 'Wishlist retrieved successfully',
                count: plainWishlistItems.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getWishlistItemById(id) {
        try {
            const wishlistItem = await this.wishlistRepository.findById(id);
            
            if (!wishlistItem) {
                throw new Error('Wishlist item not found');
            }

            return {
                success: true,
                data: wishlistItem,
                message: 'Wishlist item retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async updateWishlistItem(id, updateData) {
        try {
            const existingItem = await this.wishlistRepository.findById(id);
            
            if (!existingItem) {
                throw new Error('Wishlist item not found');
            }

            const updateEntity = WishlistEntity.createUpdateEntity(updateData);
            const wishlistItem = await this.wishlistRepository.update(id, updateEntity);
            
            return {
                success: true,
                data: wishlistItem,
                message: 'Wishlist item updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async removeFromWishlist(userId, productId) {
        try {
            const existingItem = await this.wishlistRepository.findByUserAndProduct(userId, productId);
            
            if (!existingItem) {
                throw new Error('Wishlist item not found');
            }

            const wishlistItem = await this.wishlistRepository.deleteByUserAndProduct(userId, productId);
            
            return {
                success: true,
                data: wishlistItem,
                message: 'Product removed from wishlist successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteWishlistItem(id) {
        try {
            const existingItem = await this.wishlistRepository.findById(id);
            
            if (!existingItem) {
                throw new Error('Wishlist item not found');
            }

            const wishlistItem = await this.wishlistRepository.delete(id);
            
            return {
                success: true,
                data: wishlistItem,
                message: 'Wishlist item deleted successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async clearWishlist(userId) {
        try {
            const deletedCount = await this.wishlistRepository.deleteByUser(userId);
            
            return {
                success: true,
                data: { deletedCount },
                message: `Wishlist cleared successfully. ${deletedCount} items removed.`
            };
        } catch (error) {
            throw error;
        }
    }

    async getWishlistStats(userId) {
        try {
            const stats = await this.wishlistRepository.getWishlistStats(userId);
            
            return {
                success: true,
                data: stats,
                message: 'Wishlist statistics retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async searchWishlist(userId, searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                throw new Error('Search term is required');
            }

            const wishlistItems = await this.wishlistRepository.searchWishlist(userId, searchTerm.trim());
            
            return {
                success: true,
                data: wishlistItems,
                message: 'Wishlist search completed successfully',
                count: wishlistItems.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getWishlistByVehicle(userId, vehicleId) {
        try {
            const wishlistItems = await this.wishlistRepository.findByUser(userId, { selectedVehicleId: vehicleId });
            
            return {
                success: true,
                data: wishlistItems,
                message: 'Vehicle-specific wishlist retrieved successfully',
                count: wishlistItems.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getWishlistByPriority(userId, priority) {
        try {
            const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
            if (!validPriorities.includes(priority)) {
                throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
            }

            const wishlistItems = await this.wishlistRepository.findByUser(userId, { priority });
            
            return {
                success: true,
                data: wishlistItems,
                message: 'Priority-based wishlist retrieved successfully',
                count: wishlistItems.length
            };
        } catch (error) {
            throw error;
        }
    }

    async checkIfInWishlist(userId, productId) {
        try {
            const wishlistItem = await this.wishlistRepository.findByUserAndProduct(userId, productId);
            
            return {
                success: true,
                data: { isInWishlist: !!wishlistItem, wishlistItem },
                message: 'Wishlist check completed successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getItemsForStockNotification() {
        try {
            const wishlistItems = await this.wishlistRepository.findItemsForStockNotification();
            
            return {
                success: true,
                data: wishlistItems,
                message: 'Stock notification items retrieved successfully',
                count: wishlistItems.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getItemsForPriceDropNotification() {
        try {
            const wishlistItems = await this.wishlistRepository.findItemsForPriceDropNotification();
            
            return {
                success: true,
                data: wishlistItems,
                message: 'Price drop notification items retrieved successfully',
                count: wishlistItems.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getWishlistCount(userId) {
        try {
            const count = await this.wishlistRepository.countByUser(userId);
            
            return {
                success: true,
                data: { count },
                message: 'Wishlist count retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async moveToCart(userId, productId) {
        try {
            const wishlistItem = await this.wishlistRepository.findByUserAndProduct(userId, productId);
            
            if (!wishlistItem) {
                throw new CustomError('Product not found in wishlist. Please add it to wishlist first.', 404);
            }

            // Remove from wishlist
            await this.wishlistRepository.deleteByUserAndProduct(userId, productId);
            
            // Return data for cart addition
            return {
                success: true,
                data: {
                    productId: wishlistItem.productId,
                    selectedVehicleId: wishlistItem.selectedVehicleId,
                    selectedYear: wishlistItem.selectedYear,
                    quantity: 1
                },
                message: 'Product moved from wishlist to cart successfully'
            };
        } catch (error) {
            throw error;
        }
    }
}

export default WishlistService; 