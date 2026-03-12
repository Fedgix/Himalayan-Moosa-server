import catchAsync from "../../../frameworks/middlewares/catch.async.js";
import { sendSuccess } from "../../../utils/response.handler.js";
import Banner from "../../banner/models/banner.model.js";
import Category from "../../category/models/category.model.js";
import Product from "../../product/models/product.model.js";
import VehicleMake from "../../vehicle/models/vehicle-make.model.js";
import VehicleModel from "../../vehicle/models/vehicle-model.model.js";
import VehicleVariant from "../../vehicle/models/vehicle-variant.model.js";
import Order from "../../checkout/model/order.model.js";
import User from "../../users/models/user.model.js";
import AdminService from "../services/admin.service.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";

class AdminController {
  getDashboardStats = catchAsync(async (req, res) => {
    try {
      // Get counts from all collections
      const [
        vehiclesCount,
        categoriesCount,
        productsCount,
        bannersCount,
        ordersCount,
        usersCount,
        revenueData
      ] = await Promise.all([
        VehicleMake.countDocuments({ isActive: true }),
        Category.countDocuments({ isActive: true }),
        Product.countDocuments({ isActive: true }),
        Banner.countDocuments({ isActive: true }),
        Order.countDocuments(),
        User.countDocuments({ role: 'user' }), // Count only regular users, not admins
        // Calculate revenue from paid orders
        Order.aggregate([
          {
            $match: {
              paymentStatus: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' }
            }
          }
        ])
      ]);

      // Extract revenue from aggregation result
      const revenue = revenueData && revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

      const stats = {
        vehicles: vehiclesCount,
        categories: categoriesCount,
        products: productsCount,
        banners: bannersCount,
        orders: ordersCount,
        users: usersCount,
        revenue: revenue || 0
      };

      return sendSuccess(res, "Dashboard stats retrieved successfully", stats, 200);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return sendSuccess(res, "Error fetching dashboard stats", { 
        vehicles: 0, 
        categories: 0, 
        products: 0, 
        banners: 0, 
        orders: 0, 
        users: 0, 
        revenue: 0 
      }, 200);
    }
  });

  getDashboardActivities = catchAsync(async (req, res) => {
    try {
      // Get recent activities from all collections
      const [
        recentVehicles,
        recentCategories,
        recentProducts,
        recentBanners,
        recentOrders
      ] = await Promise.all([
        VehicleMake.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name createdAt')
          .lean(),
        Category.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name createdAt')
          .lean(),
        Product.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name createdAt')
          .lean(),
        Banner.find({ isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title createdAt')
          .lean(),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('orderNumber totalAmount orderStatus createdAt')
          .lean()
      ]);

      // Combine and format activities
      const activities = [
        ...recentVehicles.map(vehicle => ({
          type: 'vehicle',
          message: `Added new vehicle make: ${vehicle.name}`,
          timestamp: vehicle.createdAt
        })),
        ...recentCategories.map(category => ({
          type: 'category',
          message: `Added new category: ${category.name}`,
          timestamp: category.createdAt
        })),
        ...recentProducts.map(product => ({
          type: 'product',
          message: `Added new product: ${product.name}`,
          timestamp: product.createdAt
        })),
        ...recentBanners.map(banner => ({
          type: 'banner',
          message: `Added new banner: ${banner.title}`,
          timestamp: banner.createdAt
        })),
        ...recentOrders.map(order => ({
          type: 'order',
          message: `New order placed: ${order.orderNumber} - ₹${order.totalAmount?.toLocaleString() || 0}`,
          timestamp: order.createdAt
        }))
      ];

      // Sort by timestamp and take the most recent 10
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recentActivities = activities.slice(0, 10);

      return sendSuccess(res, "Dashboard activities retrieved successfully", { activities: recentActivities }, 200);
    } catch (error) {
      console.error('Error fetching dashboard activities:', error);
      return sendSuccess(res, "Error fetching dashboard activities", { activities: [] }, 200);
    }
  });

  getAllOrders = catchAsync(async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        orderStatus,
        paymentStatus,
        search
      } = req.query;

      const result = await AdminService.getAllOrders({
        page,
        limit,
        orderStatus,
        paymentStatus,
        search
      });

      return sendSuccess(res, "Orders retrieved successfully", result.data, HttpStatusCode.OK);
    } catch (error) {
      throw error;
    }
  });

  updateOrderStatus = catchAsync(async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return sendSuccess(
          res,
          "Order status is required",
          null,
          HttpStatusCode.BAD_REQUEST
        );
      }

      const result = await AdminService.updateOrderStatus(id, status);

      return sendSuccess(res, result.message, result.data, HttpStatusCode.OK);
    } catch (error) {
      throw error;
    }
  });
}

export default AdminController; 