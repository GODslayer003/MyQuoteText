// backend/src/api/controllers/admin.controller.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Admin = require('../../models/Admin');
const Payment = require('../../models/Payment');
const Pricing = require('../../models/Pricing');
const AuditLog = require('../../models/AuditLog');
const Job = require('../../models/Job');
const Supplier = require('../../models/Supplier');

class AdminController {
    // Admin login
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rohan@admin.com';
            const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminRohan123!';

            // Verify hardcoded admin credentials
            if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
                await AuditLog.log({
                    action: 'admin.access',
                    severity: 'warning',
                    metadata: { email, ipAddress: req.ip, userAgent: req.get('user-agent') },
                    result: 'failure'
                });
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            // Ensure an admin user entity exists in DB (Idempotent)
            let adminUser = await User.findOne({ email: ADMIN_EMAIL });
            if (!adminUser) {
                // Create if not exists
                adminUser = await User.create({
                    email: ADMIN_EMAIL,
                    passwordHash: ADMIN_PASSWORD, // This will be hashed by pre-save
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin',
                    emailVerified: true
                });
            } else if (adminUser.role !== 'admin') {
                // Fix role if incorrect
                adminUser.role = 'admin';
                await adminUser.save();
            }

            // Generate tokens
            const accessToken = jwt.sign(
                { userId: adminUser._id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
            );
            const refreshToken = jwt.sign(
                { userId: adminUser._id, type: 'refresh' },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
            );

            await AuditLog.log({
                userId: adminUser._id,
                action: 'admin.access',
                resourceType: 'user',
                resourceId: adminUser._id.toString(),
                metadata: { ipAddress: req.ip, userAgent: req.get('user-agent') },
                result: 'success'
            });

            return res.json({
                success: true,
                data: {
                    user: {
                        id: adminUser._id,
                        email: adminUser.email,
                        role: 'admin',
                        firstName: adminUser.firstName,
                        lastName: adminUser.lastName
                    },
                    tokens: { accessToken, refreshToken }
                }
            });
        } catch (error) {
            console.error('Admin login error:', error);
            return res.status(500).json({ success: false, error: 'Login failed' });
        }
    }

    // Get Dashboard Stats
    static async getStats(req, res) {
        try {
            const [totalUsers, standardCount, premiumCount, totalJobs] = await Promise.all([
                User.countDocuments({ accountStatus: { $ne: 'deleted' } }),
                Payment.countDocuments({ status: { $in: ['succeeded', 'partially_refunded', 'refunded'] }, tier: 'standard' }),
                Payment.countDocuments({ status: { $in: ['succeeded', 'partially_refunded', 'refunded'] }, tier: 'premium' }),
                Job.countDocuments({ deletedAt: null })
            ]);

            return res.json({
                success: true,
                data: {
                    totalUsers,
                    standardPurchases: standardCount,
                    premiumPurchases: premiumCount,
                    totalJobs
                }
            });
        } catch (e) {
            console.error('Stats error:', e);
            return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
        }
    }

    // Get Revenue Analytics
    static async getRevenueStats(req, res) {
        try {
            const result = await Payment.aggregate([
                {
                    $match: {
                        status: { $in: ['succeeded', 'partially_refunded'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            const stats = result[0] || { totalRevenue: 0, count: 0 };

            return res.json({
                success: true,
                data: {
                    totalRevenue: stats.totalRevenue,
                    transactionCount: stats.count
                }
            });
        } catch (e) {
            console.error('Revenue stats error:', e);
            return res.status(500).json({ success: false, error: 'Failed to fetch revenue stats' });
        }
    }

    // Get Admin Profile
    static async getProfile(req, res) {
        try {
            const admin = await Admin.findById(req.user._id).select('-passwordHash');
            return res.json({ success: true, data: admin });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
        }
    }

    // Update Admin Profile
    static async updateProfile(req, res) {
        try {
            const { email, password, firstName, lastName } = req.body;
            const updates = {};
            if (email) updates.email = email.toLowerCase();
            if (firstName !== undefined) updates.firstName = firstName;
            if (lastName !== undefined) updates.lastName = lastName;
            if (password) updates.passwordHash = password; // pre-save hook will hash

            const admin = await Admin.findById(req.user._id).select('+passwordHash');
            if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

            Object.assign(admin, updates);
            await admin.save();

            await AuditLog.log({
                userId: admin._id,
                action: 'admin.profile_update',
                resourceType: 'admin',
                resourceId: admin._id.toString(),
                metadata: { fields: Object.keys(updates) }
            });

            const sanitized = await Admin.findById(admin._id).select('-passwordHash');
            return res.json({ success: true, data: sanitized });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to update profile' });
        }
    }

    // Get Users List (Detailed)
    static async getUsers(req, res) {
        try {
            const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Build match stage
            const matchStage = { accountStatus: { $ne: 'deleted' } };

            if (search) {
                matchStage.$or = [
                    { email: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ];
            }

            if (status !== 'all') {
                matchStage.accountStatus = status;
            }

            const [users, total] = await Promise.all([
                User.aggregate([
                    { $match: matchStage },
                    {
                        $lookup: {
                            from: 'jobs',
                            let: { userId: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$userId', '$$userId'] }, deletedAt: null } },
                                { $count: 'count' }
                            ],
                            as: 'jobStats'
                        }
                    },
                    {
                        $addFields: {
                            jobCount: { $ifNull: [{ $arrayElemAt: ['$jobStats.count', 0] }, 0] },
                            fullName: { $concat: ['$firstName', ' ', '$lastName'] }
                        }
                    },
                    { $project: { passwordHash: 0, jobStats: 0 } },
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: parseInt(limit) }
                ]),
                User.countDocuments(matchStage)
            ]);

            return res.json({
                success: true,
                data: users,
                pagination: { page: parseInt(page), limit: parseInt(limit), total }
            });
        } catch (e) {
            console.error('Users fetch error:', e);
            return res.status(500).json({ success: false, error: 'Failed to fetch users' });
        }
    }

    // Get Payments
    static async getPayments(req, res) {
        try {
            const { page = 1, limit = 10, status = 'all', tier = 'all' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            let query = {};

            if (status !== 'all') {
                query.status = status;
            }

            if (tier !== 'all') {
                query.tier = tier;
            }

            const [payments, total] = await Promise.all([
                Payment.find(query)
                    .skip(skip)
                    .limit(parseInt(limit))
                    .populate('userId', 'email firstName lastName')
                    .sort({ createdAt: -1 }),
                Payment.countDocuments(query)
            ]);

            return res.json({
                success: true,
                data: payments,
                pagination: { page: parseInt(page), limit: parseInt(limit), total }
            });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to fetch payments' });
        }
    }

    // Get Suppliers (Sorted by Score)
    static async getSuppliers(req, res) {
        try {
            const { search = '' } = req.query;
            const query = {};
            if (search) {
                query.$or = [
                    { supplierName: { $regex: search, $options: 'i' } },
                    { abn: { $regex: search, $options: 'i' } }
                ];
            }

            const suppliers = await Supplier.find(query).sort({ score: -1 });
            return res.json({ success: true, data: suppliers });
        } catch (e) {
            console.error('Suppliers fetch error:', e);
            return res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
        }
    }

    // Get Single Supplier Details
    static async getSupplierDetails(req, res) {
        try {
            const { id } = req.params;
            const SupplierQuote = require('../../models/SupplierQuote');
            const SupplierStats = require('../../models/SupplierStats');

            const [supplier, stats, quotes] = await Promise.all([
                Supplier.findById(id),
                SupplierStats.findOne({ supplierId: id }),
                SupplierQuote.find({ supplierId: id }).sort({ createdAt: -1 }).limit(10)
            ]);

            if (!supplier) {
                return res.status(404).json({ success: false, error: 'Supplier not found' });
            }

            return res.json({
                success: true,
                data: {
                    supplier,
                    stats,
                    history: quotes
                }
            });
        } catch (e) {
            console.error('Supplier details error:', e);
            return res.status(500).json({ success: false, error: 'Failed to fetch supplier details' });
        }
    }

    // Pricing Management
    static async getAdminPricing(req, res) {
        try {
            const pricing = await Pricing.find().sort({ price: 1 });
            return res.json({ success: true, data: pricing });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to fetch pricing' });
        }
    }

    static async createPricing(req, res) {
        try {
            const { name, tier, price, description, features } = req.body;
            const pricing = new Pricing({
                name,
                tier,
                price: parseFloat(price),
                description,
                features: features || []
            });
            await pricing.save();
            return res.status(201).json({ success: true, data: pricing });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to create pricing' });
        }
    }

    static async updatePricing(req, res) {
        try {
            const { id } = req.params;
            const pricing = await Pricing.findByIdAndUpdate(id, req.body, { new: true });
            if (!pricing) return res.status(404).json({ success: false, error: 'Pricing not found' });
            return res.json({ success: true, data: pricing });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to update pricing' });
        }
    }

    static async deletePricing(req, res) {
        try {
            const { id } = req.params;
            const pricing = await Pricing.findByIdAndDelete(id);
            if (!pricing) return res.status(404).json({ success: false, error: 'Pricing not found' });
            return res.json({ success: true, message: 'Pricing deleted' });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to delete pricing' });
        }
    }

    // Get Discount History
    static async getDiscountHistory(req, res) {
        try {
            const DiscountUsage = require('../../models/DiscountUsage');
            const history = await DiscountUsage.find()
                .populate('userId', 'email')
                .sort({ usedAt: -1 });
            return res.json({ success: true, data: history });
        } catch (e) {
            console.error('History fetch error:', e);
            return res.status(500).json({ success: false, error: 'Failed to fetch history' });
        }
    }

    // User Management Actions (Delete/Update Status)
    static async updateUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { accountStatus } = req.body;

            const user = await User.findByIdAndUpdate(
                userId,
                { accountStatus },
                { new: true }
            );

            return res.json({ success: true, data: user });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to update user status' });
        }
    }

    static async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);
            if (user) {
                await user.softDelete();
            }
            return res.json({ success: true, message: 'User deleted' });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Failed to delete user' });
        }
    }
}

module.exports = AdminController;
