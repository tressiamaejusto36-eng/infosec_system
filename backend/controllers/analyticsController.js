import { body } from "express-validator";
import mongoose from "mongoose";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Reservation from "../models/Reservation.js";

// ─── Dashboard Analytics ──────────────────────────────────────
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Parallel queries for better performance
    const [
      totalUsers,
      totalRooms,
      totalReservations,
      recentReservations,
      revenueData,
      occupancyData,
      roomTypeStats,
      userGrowth
    ] = await Promise.all([
      // Total counts
      User.countDocuments(),
      Room.countDocuments(),
      Reservation.countDocuments(),
      
      // Recent reservations
      Reservation.find({ createdAt: { $gte: startDate } })
        .populate('userId', 'name email')
        .populate('roomId', 'roomNumber roomType')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Revenue analytics
      Reservation.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            averageBookingValue: { $avg: '$totalPrice' },
            totalBookings: { $sum: 1 }
          }
        }
      ]),
      
      // Occupancy data
      Reservation.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Room type popularity
      Reservation.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'room'
          }
        },
        { $unwind: '$room' },
        {
          $group: {
            _id: '$room.roomType',
            bookings: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        },
        { $sort: { bookings: -1 } }
      ]),
      
      // User growth (last 7 days)
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate additional metrics
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const occupancyRate = totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms * 100).toFixed(1) : 0;
    
    const revenue = revenueData[0] || { totalRevenue: 0, averageBookingValue: 0, totalBookings: 0 };
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRooms,
          availableRooms,
          totalReservations,
          occupancyRate: parseFloat(occupancyRate)
        },
        revenue: {
          totalRevenue: revenue.totalRevenue || 0,
          averageBookingValue: revenue.averageBookingValue || 0,
          totalBookings: revenue.totalBookings || 0
        },
        recentReservations,
        occupancyData,
        roomTypeStats,
        userGrowth,
        period: parseInt(period)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Revenue Analytics ────────────────────────────────────────
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = "%Y-%m-%d %H:00";
        break;
      case 'day':
        dateFormat = "%Y-%m-%d";
        break;
      case 'week':
        dateFormat = "%Y-W%U";
        break;
      case 'month':
        dateFormat = "%Y-%m";
        break;
      default:
        dateFormat = "%Y-%m-%d";
    }

    const revenueByPeriod = await Reservation.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          averageValue: { $avg: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue by room type
    const revenueByRoomType = await Reservation.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      {
        $group: {
          _id: '$room.roomType',
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 },
          averagePrice: { $avg: '$room.price' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenueByPeriod,
        revenueByRoomType,
        period: parseInt(period),
        groupBy
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Occupancy Analytics ──────────────────────────────────────
export const getOccupancyAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Daily occupancy rates
    const occupancyByDay = await Reservation.aggregate([
      {
        $match: {
          $or: [
            { checkInDate: { $gte: startDate } },
            { checkOutDate: { $gte: startDate } }
          ],
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkInDate" } },
          occupiedRooms: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Room status distribution
    const roomStatusDistribution = await Room.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average stay duration
    const averageStayDuration = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $project: {
          stayDuration: {
            $divide: [
              { $subtract: ['$checkOutDate', '$checkInDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageDuration: { $avg: '$stayDuration' },
          minDuration: { $min: '$stayDuration' },
          maxDuration: { $max: '$stayDuration' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        occupancyByDay,
        roomStatusDistribution,
        averageStayDuration: averageStayDuration[0] || {
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0
        },
        period: parseInt(period)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Customer Analytics ───────────────────────────────────────
export const getCustomerAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Customer segments
    const customerSegments = await User.aggregate([
      {
        $lookup: {
          from: 'reservations',
          localField: '_id',
          foreignField: 'userId',
          as: 'reservations'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          createdAt: 1,
          totalBookings: { $size: '$reservations' },
          totalSpent: {
            $sum: {
              $map: {
                input: '$reservations',
                as: 'reservation',
                in: '$$reservation.totalPrice'
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          createdAt: 1,
          totalBookings: 1,
          totalSpent: 1,
          segment: {
            $switch: {
              branches: [
                { case: { $gte: ['$totalSpent', 1000] }, then: 'VIP' },
                { case: { $gte: ['$totalSpent', 500] }, then: 'Premium' },
                { case: { $gte: ['$totalBookings', 3] }, then: 'Loyal' },
                { case: { $gte: ['$totalBookings', 1] }, then: 'Regular' }
              ],
              default: 'New'
            }
          }
        }
      },
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          averageSpent: { $avg: '$totalSpent' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Top customers
    const topCustomers = await User.aggregate([
      {
        $lookup: {
          from: 'reservations',
          localField: '_id',
          foreignField: 'userId',
          as: 'reservations'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          totalBookings: { $size: '$reservations' },
          totalSpent: {
            $sum: {
              $map: {
                input: '$reservations',
                as: 'reservation',
                in: '$$reservation.totalPrice'
              }
            }
          }
        }
      },
      { $match: { totalBookings: { $gt: 0 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // New vs returning customers
    const customerRetention = await Reservation.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $lookup: {
          from: 'reservations',
          let: { userId: '$userId', currentDate: '$createdAt' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $lt: ['$createdAt', '$$currentDate'] }
                  ]
                }
              }
            }
          ],
          as: 'previousBookings'
        }
      },
      {
        $project: {
          userId: 1,
          isReturning: { $gt: [{ $size: '$previousBookings' }, 0] }
        }
      },
      {
        $group: {
          _id: '$isReturning',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        customerSegments,
        topCustomers,
        customerRetention,
        period: parseInt(period)
      }
    });
  } catch (error) {
    next(error);
  }
};