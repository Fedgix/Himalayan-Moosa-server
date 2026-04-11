import Wishlist from '../models/wishlist.model.js';
import WishlistEntity from '../entity/wishlist.entity.js';
import { ownerQuery } from '../../../utils/cartWishlistOwner.js';

class WishlistRepository {
    async create(wishlistData) {
        try {
            const wishlist = new Wishlist(wishlistData);
            const savedWishlist = await wishlist.save();
            return WishlistEntity.fromModel(savedWishlist);
        } catch (error) {
            throw error;
        }
    }

    async findById(id) {
        try {
            const wishlist = await Wishlist.findById(id)
                .populate({
                    path: 'product',
                    select: 'name description pricing images category brand sku isActive inventory'
                })
                .populate({
                    path: 'variant',
                    select: 'name sku pricing images attributes inventory isActive isDefault'
                })
                .populate('user');
            return WishlistEntity.fromModel(wishlist);
        } catch (error) {
            throw error;
        }
    }

    async findByOwner(owner, filters = {}) {
        try {
            const query = { ...ownerQuery(owner) };
            
            if (filters.priority) {
                query.priority = filters.priority;
            }
            
            
            if (filters.notifyOnStock !== undefined) {
                query.notifyOnStock = filters.notifyOnStock;
            }
            
            if (filters.notifyOnPriceDrop !== undefined) {
                query.notifyOnPriceDrop = filters.notifyOnPriceDrop;
            }

            const wishlistItems = await Wishlist.find(query)
                .populate({
                    path: 'product',
                    select: 'name description pricing images category brand sku isActive inventory'
                })
                .populate({
                    path: 'variant',
                    select: 'name sku pricing images attributes inventory isActive isDefault'
                })
                .sort({ priority: -1, createdAt: -1 });
            
            return WishlistEntity.fromModelList(wishlistItems);
        } catch (error) {
            throw error;
        }
    }

    async findByProduct(productId) {
        try {
            const wishlistItems = await Wishlist.find({ productId })
                .populate('user')
                .sort({ createdAt: -1 });
            
            return WishlistEntity.fromModelList(wishlistItems);
        } catch (error) {
            throw error;
        }
    }

    async findByOwnerAndProduct(owner, productId) {
        try {
            const wishlist = await Wishlist.findOne({ ...ownerQuery(owner), productId })
                .populate({
                    path: 'product',
                    select: 'name description pricing images category brand sku isActive inventory'
                })
                .populate({
                    path: 'variant',
                    select: 'name sku pricing images attributes inventory isActive isDefault'
                });
            
            return WishlistEntity.fromModel(wishlist);
        } catch (error) {
            throw error;
        }
    }

    async findByOwnerProductVariant(owner, productId, variantId) {
        try {
            const query = { ...ownerQuery(owner), productId };
            if (variantId) {
                query.variantId = variantId;
            } else {
                query.variantId = null;
            }
            
            const wishlist = await Wishlist.findOne(query)
                .populate({
                    path: 'product',
                    select: 'name description pricing images category brand sku isActive inventory'
                })
                .populate({
                    path: 'variant',
                    select: 'name sku pricing images attributes inventory isActive isDefault'
                });
            
            return WishlistEntity.fromModel(wishlist);
        } catch (error) {
            throw error;
        }
    }

    async findByVehicle(vehicleId) {
        try {
            const wishlistItems = await Wishlist.find({ selectedVehicleId: vehicleId })
                .populate('product')
                .populate('userId')
                .sort({ priority: -1, createdAt: -1 });
            
            return WishlistEntity.fromModelList(wishlistItems);
        } catch (error) {
            throw error;
        }
    }

    async findItemsForStockNotification() {
        try {
            const wishlistItems = await Wishlist.find({ notifyOnStock: true })
                .populate('product')
                .populate('userId');
            
            return WishlistEntity.fromModelList(wishlistItems);
        } catch (error) {
            throw error;
        }
    }

    async findItemsForPriceDropNotification() {
        try {
            const wishlistItems = await Wishlist.find({ notifyOnPriceDrop: true })
                .populate('product')
                .populate('userId');
            
            return WishlistEntity.fromModelList(wishlistItems);
        } catch (error) {
            throw error;
        }
    }

    async update(id, updateData) {
        try {
            const wishlist = await Wishlist.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            )
            .populate({
                path: 'product',
                select: 'name description pricing images category brand sku isActive inventory'
            })
            .populate({
                path: 'variant',
                select: 'name sku pricing images attributes inventory isActive isDefault'
            })
            .populate('user');
            
            return WishlistEntity.fromModel(wishlist);
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            const wishlist = await Wishlist.findByIdAndDelete(id);
            return WishlistEntity.fromModel(wishlist);
        } catch (error) {
            throw error;
        }
    }

    async deleteByOwnerAndProduct(owner, productId) {
        try {
            const wishlist = await Wishlist.findOneAndDelete({ ...ownerQuery(owner), productId });
            return WishlistEntity.fromModel(wishlist);
        } catch (error) {
            throw error;
        }
    }

    async deleteByOwner(owner) {
        try {
            const result = await Wishlist.deleteMany(ownerQuery(owner));
            return result.deletedCount;
        } catch (error) {
            throw error;
        }
    }

    async countByOwner(owner) {
        try {
            return await Wishlist.countDocuments(ownerQuery(owner));
        } catch (error) {
            throw error;
        }
    }

    async countByProduct(productId) {
        try {
            return await Wishlist.countDocuments({ productId });
        } catch (error) {
            throw error;
        }
    }

    async countByVehicle(vehicleId) {
        try {
            return await Wishlist.countDocuments({ selectedVehicleId: vehicleId });
        } catch (error) {
            throw error;
        }
    }

    async getWishlistStats(owner) {
        try {
            const stats = await Wishlist.aggregate([
                { $match: ownerQuery(owner) },
                {
                    $group: {
                        _id: null,
                        totalItems: { $sum: 1 },
                        highPriority: {
                            $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] }
                        },
                        urgentPriority: {
                            $sum: { $cond: [{ $eq: ['$priority', 'Urgent'] }, 1, 0] }
                        },
                        withVehicleSelection: {
                            $sum: { $cond: [{ $ne: ['$selectedVehicleId', null] }, 1, 0] }
                        },
                        stockNotifications: {
                            $sum: { $cond: ['$notifyOnStock', 1, 0] }
                        },
                        priceDropNotifications: {
                            $sum: { $cond: ['$notifyOnPriceDrop', 1, 0] }
                        }
                    }
                }
            ]);

            return stats[0] || {
                totalItems: 0,
                highPriority: 0,
                urgentPriority: 0,
                withVehicleSelection: 0,
                stockNotifications: 0,
                priceDropNotifications: 0
            };
        } catch (error) {
            throw error;
        }
    }

    async searchWishlist(owner, searchTerm) {
        try {
            const wishlistItems = await Wishlist.find({ ...ownerQuery(owner) })
                .populate({
                    path: 'productId',
                    match: {
                        $or: [
                            { name: { $regex: searchTerm, $options: 'i' } },
                            { description: { $regex: searchTerm, $options: 'i' } },
                            { brand: { $regex: searchTerm, $options: 'i' } }
                        ]
                    }
                })
                .populate({
                    path: 'variant',
                    select: 'name sku pricing images attributes inventory isActive isDefault'
                })
                .sort({ priority: -1, createdAt: -1 });

            // Filter out items where product doesn't match search
            const filteredItems = wishlistItems.filter(item => item.productId);
            
            return WishlistEntity.fromModelList(filteredItems);
        } catch (error) {
            throw error;
        }
    }
}

export default WishlistRepository; 