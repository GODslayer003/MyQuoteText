// backend/src/api/controllers/admin.controller.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Payment = require('../../models/Payment');
const AuditLog = require('../../models/AuditLog');
const Job = require('../../models/Job');

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

    // Get Admin Profile
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user._id).select('-passwordHash');
            return res.json({ success: true, data: user });
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

            const user = await User.findById(req.user._id).select('+passwordHash');
            if (!user) return res.status(404).json({ success: false, error: 'Admin not found' });

            Object.assign(user, updates);
            await user.save();

            await AuditLog.log({
                userId: user._id,
                action: 'user.profile_update',
                resourceType: 'user',
                resourceId: user._id.toString(),
                metadata: { fields: Object.keys(updates) }
            });

            const sanitized = await User.findById(user._id).select('-passwordHash');
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
