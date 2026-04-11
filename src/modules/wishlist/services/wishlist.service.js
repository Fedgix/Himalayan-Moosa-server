import WishlistRepository from '../repository/wishlist.repository.js';
import WishlistEntity from '../entity/wishlist.entity.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';
import { itemBelongsToOwner } from '../../../utils/cartWishlistOwner.js';

class WishlistService {
    constructor() {
        this.wishlistRepository = new WishlistRepository();
    }

    async addToWishlist(owner, body) {
        try {
            const { userId: _ignoreUser, guestId: _ignoreGuest, ...rest } = body || {};
            const wishlistData = {
                ...rest,
                ...(owner.userId ? { userId: owner.userId.toString() } : { guestId: owner.guestId }),
            };

            const existingItem = await this.wishlistRepository.findByOwnerProductVariant(
                owner,
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

    async getWishlistByOwner(owner, filters = {}) {
        try {
            const wishlistItems = await this.wishlistRepository.findByOwner(owner, filters);

            const plainWishlistItems = wishlistItems.map(item => {
                const plainItem = {
                    id: item.id,
                    userId: item.userId,
                    guestId: item.guestId,
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

    async getWishlistItemById(id, owner) {
        try {
            const wishlistItem = await this.wishlistRepository.findById(id);

            if (!wishlistItem) {
                throw new CustomError('Wishlist item not found', HttpStatusCode.NOT_FOUND);
            }
            if (!itemBelongsToOwner(wishlistItem, owner)) {
                throw new CustomError('Forbidden', HttpStatusCode.FORBIDDEN);
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

    async updateWishlistItem(id, owner, updateData) {
        try {
            const existingItem = await this.wishlistRepository.findById(id);

            if (!existingItem) {
                throw new CustomError('Wishlist item not found', HttpStatusCode.NOT_FOUND);
            }
            if (!itemBelongsToOwner(existingItem, owner)) {
                throw new CustomError('Forbidden', HttpStatusCode.FORBIDDEN);
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

    async removeFromWishlist(owner, productId) {
        try {
            const existingItem = await this.wishlistRepository.findByOwnerAndProduct(owner, productId);

            if (!existingItem) {
                throw new CustomError('Wishlist item not found', HttpStatusCode.NOT_FOUND);
            }

            const wishlistItem = await this.wishlistRepository.deleteByOwnerAndProduct(owner, productId);

            return {
                success: true,
                data: wishlistItem,
                message: 'Product removed from wishlist successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteWishlistItem(id, owner) {
        try {
            const existingItem = await this.wishlistRepository.findById(id);

            if (!existingItem) {
                throw new CustomError('Wishlist item not found', HttpStatusCode.NOT_FOUND);
            }
            if (!itemBelongsToOwner(existingItem, owner)) {
                throw new CustomError('Forbidden', HttpStatusCode.FORBIDDEN);
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

    async clearWishlist(owner) {
        try {
            const deletedCount = await this.wishlistRepository.deleteByOwner(owner);

            return {
                success: true,
                data: { deletedCount },
                message: `Wishlist cleared successfully. ${deletedCount} items removed.`
            };
        } catch (error) {
            throw error;
        }
    }

    async getWishlistStats(owner) {
        try {
            const stats = await this.wishlistRepository.getWishlistStats(owner);

            return {
                success: true,
                data: stats,
                message: 'Wishlist statistics retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async searchWishlist(owner, searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                throw new CustomError('Search term is required', HttpStatusCode.BAD_REQUEST);
            }

            const wishlistItems = await this.wishlistRepository.searchWishlist(owner, searchTerm.trim());

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

    async getWishlistByVehicle(owner, vehicleId) {
        try {
            const wishlistItems = await this.wishlistRepository.findByOwner(owner, { selectedVehicleId: vehicleId });

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

    async getWishlistByPriority(owner, priority) {
        try {
            const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
            if (!validPriorities.includes(priority)) {
                throw new CustomError(
                    `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
                    HttpStatusCode.BAD_REQUEST
                );
            }

            const wishlistItems = await this.wishlistRepository.findByOwner(owner, { priority });

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

    async checkIfInWishlist(owner, productId) {
        try {
            const wishlistItem = await this.wishlistRepository.findByOwnerAndProduct(owner, productId);

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

    async getWishlistCount(owner) {
        try {
            const count = await this.wishlistRepository.countByOwner(owner);

            return {
                success: true,
                data: { count },
                message: 'Wishlist count retrieved successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async moveToCart(owner, productId) {
        try {
            const wishlistItem = await this.wishlistRepository.findByOwnerAndProduct(owner, productId);

            if (!wishlistItem) {
                throw new CustomError('Product not found in wishlist. Please add it to wishlist first.', 404);
            }

            await this.wishlistRepository.deleteByOwnerAndProduct(owner, productId);

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
