import Admin from '../models/admin.model.js';
import Order from '../../checkout/model/order.model.js';
import { jwtUtils } from '../../../utils/jwt.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

class AdminService {
  async login(email, password) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      console.log('🔐 Admin login attempt:', { email: normalizedEmail });
      
      // Check if Admin model is connected
      console.log('📊 Admin model collection name:', Admin.collection?.name || 'Not connected');
      
      // Try to find admin
      const admin = await Admin.findOne({ email: normalizedEmail });
      
      if (!admin) {
        console.log('❌ Admin not found for email:', normalizedEmail);
        // Try to find all admins to debug
        const allAdmins = await Admin.find({}).limit(5);
        console.log('📋 Total admins in DB:', allAdmins.length);
        if (allAdmins.length > 0) {
          console.log('📋 Sample admin emails:', allAdmins.map(a => a.email));
        }
        throw new CustomError('Invalid credentials', HttpStatusCode.UNAUTHORIZED, true);
      }

      console.log('✅ Admin found:', { id: admin._id, email: admin.email, isActive: admin.isActive });

      if (!admin.isActive) {
        console.log('❌ Admin account is deactivated');
        throw new CustomError('Admin account is deactivated', HttpStatusCode.FORBIDDEN, true);
      }

      const isPasswordValid = await admin.comparePassword(password);
      console.log('🔑 Password validation result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password');
        throw new CustomError('Invalid credentials', HttpStatusCode.UNAUTHORIZED, true);
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate admin tokens using separate admin JWT functions
      const tokens = jwtUtils.generateAdminTokenPair(admin);
      const accessToken = tokens.accessToken;
      const refreshToken = tokens.refreshToken;

      return {
        success: true,
        message: 'Admin login successful',
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
          },
          token: accessToken, // For frontend compatibility
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Login failed', HttpStatusCode.INTERNAL_SERVER, true);
    }
  }

  async getAdminById(adminId) {
    try {
      const admin = await Admin.findById(adminId);
      
      if (!admin) {
        throw new CustomError('Admin not found', HttpStatusCode.NOT_FOUND, true);
      }

      return {
        success: true,
        data: admin.toJSON()
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to fetch admin', HttpStatusCode.INTERNAL_SERVER, true);
    }
  }

  async verifyToken(adminId) {
    try {
      const admin = await Admin.findById(adminId);
      
      if (!admin || !admin.isActive) {
        throw new CustomError('Admin not found or inactive', HttpStatusCode.UNAUTHORIZED, true);
      }

      return {
        success: true,
        data: {
          admin: admin.toJSON()
        }
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Token verification failed', HttpStatusCode.UNAUTHORIZED, true);
    }
  }

  async getAllOrders(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        orderStatus,
        paymentStatus,
        search
      } = options;

      // Build query
      const query = {};
      
      if (orderStatus) {
        query.orderStatus = orderStatus;
      }
      
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }

      // Search by order number or user email
      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      // Fetch orders with pagination and populate user details
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .populate('userId', 'name email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(query)
      ]);

      return {
        success: true,
        data: {
          orders,
          pagination: {
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(totalCount / limit)
          }
        }
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to fetch orders', HttpStatusCode.INTERNAL_SERVER_ERROR, true);
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      // Valid order statuses enum
      const validStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
      
      if (!validStatuses.includes(status)) {
        throw new CustomError(
          `Invalid order status. Valid statuses are: ${validStatuses.join(', ')}`,
          HttpStatusCode.BAD_REQUEST,
          true
        );
      }

      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new CustomError('Order not found', HttpStatusCode.NOT_FOUND, true);
      }

      // Update order status
      order.orderStatus = status;

      // Set deliveredAt timestamp when status is delivered
      if (status === 'delivered' && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }

      // Set cancelledAt timestamp when status is cancelled
      if (status === 'cancelled' && !order.cancelledAt) {
        order.cancelledAt = new Date();
      }

      await order.save();

      return {
        success: true,
        message: `Order status updated to ${status}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          updatedAt: order.updatedAt
        }
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update order status', HttpStatusCode.INTERNAL_SERVER_ERROR, true);
    }
  }
}

export default new AdminService();

