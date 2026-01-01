// ============================================
// src/workers/processors/aiProcessor.js
// ============================================
const Job = require('../../models/Job');
const Result = require('../../models/Result');
const { Supplier } = require('../../models/Lead');
const AIOrchestrator = require('../../services/ai/AIOrchestrator');
const { emailQueue } = require('../../config/queue');
const logger = require('../../utils/logger');

class AIProcessor {
  async process(job) {
    const { jobId, extractedText, tier, ocrConfidence } = job.data;

    try {
      logger.info(`AI analysis started for job ${jobId}`);

      const jobDoc = await Job.findById(jobId).populate('leadId');

      if (!jobDoc) {
        throw new Error('Job not found');
      }

      // Update status
      await jobDoc.updateProcessingStep('analysis', 'in_progress');
      jobDoc.status = 'processing';
      await jobDoc.save();

      // Metadata for AI
      const metadata = {
        workCategory: jobDoc.metadata?.workCategory,
        propertyType: jobDoc.metadata?.propertyType,
        ocrConfidence: ocrConfidence
      };

      // Call AI service
      const aiResult = await AIOrchestrator.analyzeQuote(extractedText, tier, metadata);

      // Create result
      const result = await this.createResult(jobDoc, aiResult, tier);

      // Update job
      jobDoc.result = result._id;
      jobDoc.status = 'completed';
      await jobDoc.updateProcessingStep('analysis', 'completed');
      await jobDoc.save();

      // Update supplier intelligence (internal only)
      if (aiResult.analysis?.contractorProfile?.abn) {
        await this.updateSupplierIntelligence(
          aiResult.analysis.contractorProfile,
          aiResult.analysis
        );
      }

      // Send email notification
      if (jobDoc.leadId?.email) {
        await emailQueue.add('send-email', {
          to: jobDoc.leadId.email,
          template: tier === 'free' ? 'free_complete' : 'paid_complete',
          data: {
            jobId: jobDoc.jobId,
            tier: tier,
            hasPaymentRequired: tier !== 'free' && !jobDoc.unlocked
          }
        });
      }

      logger.info(`AI analysis completed for job ${jobId}`);

      return {
        success: true,
        resultId: result._id
      };
    } catch (error) {
      logger.error(`AI analysis failed for job ${jobId}:`, error);

      const jobDoc = await Job.findById(jobId);
      if (jobDoc) {
        jobDoc.status = 'failed';
        await jobDoc.updateProcessingStep('analysis', 'failed', error.message);
        await jobDoc.save();
      }

      throw error;
    }
  }

  async createResult(job, aiResult, tier) {
    const resultData = {
      jobId: job._id,
      userId: job.userId,
      tier: tier,
      aiResponse: {
        model: aiResult.aiResponse.model,
        promptVersion: '1.0',
        completionTokens: aiResult.aiResponse.completionTokens,
        totalTokens: aiResult.aiResponse.totalTokens,
        finishReason: aiResult.aiResponse.finishReason,
        rawOutput: aiResult
      },
      generatedAt: new Date()
    };

    if (tier === 'free') {
      resultData.freeSummary = aiResult.freeSummary;
    } else {
      resultData.analysis = aiResult.analysis;
      resultData.qualityScore = Result.calculateQualityScore(aiResult.analysis);
      resultData.confidenceLevel = aiResult.confidenceLevel || 'medium';
    }

    return await Result.create(resultData);
  }

  async updateSupplierIntelligence(contractorProfile, analysis) {
    try {
      if (!contractorProfile.abn) return;

      let supplier = await Supplier.findOne({ abn: contractorProfile.abn });

      if (!supplier) {
        supplier = await Supplier.create({
          name: contractorProfile.name,
          abn: contractorProfile.abn,
          intelligence: {
            totalQuotesSeen: 1,
            redFlagCount: analysis.redFlags?.length || 0,
            lastSeenDate: new Date()
          }
        });
      } else {
        await supplier.updateIntelligence({ redFlags: analysis.redFlags });
      }
    } catch (error) {
      logger.error('Failed to update supplier intelligence:', error);
    }
  }
}

module.exports = new AIProcessor();