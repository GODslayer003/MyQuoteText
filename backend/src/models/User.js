// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    select: false
  },
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  avatarUrl: {
    type: String,
    trim: true
  },
  subscription: {
    plan: {
      type: String,
      enum: ['Free', 'Professional', 'Enterprise'],
      default: 'Free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired'],
      default: 'active'
    },
    expiresAt: {
      type: Date
    },
    reportsUsed: {
      type: Number,
      default: 0
    },
    reportsTotal: {
      type: Number,
      default: 3 // Default for Free plan
    }
  },
  preferences: {
    email: {
      type: Boolean,
      default: true
    },
    reportReady: {
      type: Boolean,
      default: true
    },
    promotional: {
      type: Boolean,
      default: false
    },
    reminders: {
      type: Boolean,
      default: true
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    lastLoginAt: {
      type: Date
    }
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  deletedAt: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  metadata: {
    registrationSource: String, // 'free_upload', 'payment', 'manual'
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true,
  collection: 'users',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1, accountStatus: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ 'subscription.status': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for active subscription
userSchema.virtual('hasActiveSubscription').get(function() {
  return this.subscription.status === 'active';
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, rounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.security.lastLoginAt = new Date();
  return this.save();
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    return this.save();
  }
  
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5 && !this.isLocked) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  }
  
  return this.save();
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ 
    email: email.toLowerCase(), 
    accountStatus: { $ne: 'deleted' }
  });
};

// Soft delete
userSchema.methods.softDelete = function() {
  this.accountStatus = 'deleted';
  this.deletedAt = new Date();
  // Anonymize email to allow reuse
  this.email = `deleted_${Date.now()}_${this.email}`;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);