// ============================================
// src/models/Job.js
// ============================================

const mongoose = require('mongoose');

// ---------------------------------------------
// Processing Step Schema
// ---------------------------------------------
const processingStepSchema = new mongoose.Schema(
  {
    step: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    message: {
      type: String
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// ---------------------------------------------
// Job Schema
// ---------------------------------------------
const jobSchema = new mongoose.Schema(
  {
    // Public ID (UUID)
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Relations
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true
    },

    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      }
    ],

    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result'
    },

    // Pricing / Access
    tier: {
      type: String,
      enum: ['free', 'standard', 'premium'],
      default: 'free'
    },

    unlocked: {
      type: Boolean,
      default: false,
      index: true
    },

    // Processing state
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },

    // Pipeline steps
    processingSteps: {
      type: [processingStepSchema],
      default: []
    },

    // Metadata
    metadata: {
      type: Object
    },

    // Soft delete
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'jobs'
  }
);

// --------------------------------------------------
// INDEXES
// --------------------------------------------------
jobSchema.index({ userId: 1, createdAt: -1 });
jobSchema.index({ leadId: 1, createdAt: -1 });
jobSchema.index({ unlocked: 1, tier: 1 });

// --------------------------------------------------
// INSTANCE METHODS
// --------------------------------------------------

/**
 * Update or insert a processing step
 */
jobSchema.methods.updateProcessingStep = function (
  step,
  status,
  message = null
) {
  const existingStep = this.processingSteps.find(
    (s) => s.step === step
  );

  if (existingStep) {
    existingStep.status = status;
    existingStep.message = message;
    existingStep.updatedAt = new Date();
  } else {
    this.processingSteps.push({
      step,
      status,
      message,
      updatedAt: new Date()
    });
  }

  // Auto-update job status
  if (status === 'failed') {
    this.status = 'failed';
  } else if (status === 'completed') {
    const allCompleted = this.processingSteps.every(
      (s) => s.status === 'completed'
    );
    if (allCompleted) {
      this.status = 'completed';
    }
  } else {
    this.status = 'processing';
  }

  return this;
};

// --------------------------------------------------
// STATIC METHODS
// --------------------------------------------------

/**
 * Find job by public jobId (ignores soft-deleted jobs)
 */
jobSchema.statics.findByPublicId = function (jobId) {
  return this.findOne({ jobId, deletedAt: null });
};

// --------------------------------------------------
// EXPORT
// --------------------------------------------------
module.exports = mongoose.model('Job', jobSchema);