const mongoose = require('mongoose');

// Supplier.js - INTERNAL ONLY intelligence system
const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  abn: {
    type: String,
    unique: true,
    sparse: true
  },
  aliases: [String], // Other names this contractor operates under
  contactInfo: {
    email: String,
    phone: String,
    website: String,
    address: {
      street: String,
      suburb: String,
      state: String,
      postcode: String
    }
  },
  // Intelligence scoring (NEVER EXPOSED TO USERS)
  intelligence: {
    totalQuotesSeen: {
      type: Number,
      default: 0
    },
    averagePricing: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    redFlagCount: {
      type: Number,
      default: 0
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    commonIssues: [String],
    lastSeenDate: Date
  },
  // Internal notes only
  internalNotes: [{
    note: String,
    createdBy: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  _internal: {
    type: Boolean,
    default: true,
    select: false
  }
}, {
  timestamps: true,
  collection: 'suppliers'
});

supplierSchema.index({ abn: 1 });
supplierSchema.index({ name: 1 });
supplierSchema.index({ 'intelligence.riskScore': -1 });

// Method to update intelligence
supplierSchema.methods.updateIntelligence = function (quoteData) {
  this.intelligence.totalQuotesSeen += 1;
  this.intelligence.lastSeenDate = new Date();

  if (quoteData.redFlags && quoteData.redFlags.length > 0) {
    this.intelligence.redFlagCount += quoteData.redFlags.length;

    // Update risk score based on red flags
    const criticalFlags = quoteData.redFlags.filter(f => f.severity === 'critical').length;
    this.intelligence.riskScore = Math.min(
      100,
      this.intelligence.riskScore + (criticalFlags * 10)
    );
  }

  return this.save();
};

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;