// ============================================
// src/workers/processors/aiProcessor.js
// ============================================
const Job = require('../../models/Job');
const Result = require('../../models/Result');
const User = require('../../models/User');
const { Supplier } = require('../../models/Lead');
const AIOrchestrator = require('../../services/ai/AIOrchestrator');
const { emailQueue } = require('../../config/queue');
const logger = require('../../utils/logger');

class AIProcessor {
  normalizeVerdict(verdictLabel, score) {
    if (!verdictLabel) {
      if (score >= 9) return 'excellent';
      if (score >= 7) return 'good';
      if (score >= 4) return 'fair';
      return 'overpriced';
    }

    const label = verdictLabel.toLowerCase();

    // Exact matches
    if (['excellent', 'good', 'fair', 'overpriced', 'irrelevant'].includes(label)) {
      return label;
    }

    // Semantic mapping
    if (label.includes('great') || label.includes('excellent') || label.includes('perfect')) return 'excellent';
    if (label.includes('good') || label.includes('within range') || label.includes('fair price') || label.includes('reasonable')) return 'good';
    if (label.includes('fair') || label.includes('average') || label.includes('moderate')) return 'fair';
    if (label.includes('high') || label.includes('overpriced') || label.includes('expensive')) return 'overpriced';

    // Fallback to score
    if (score >= 9) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 4) return 'fair';
    return 'overpriced';
  }

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
    let resultData = {
      jobId: job._id,
      userId: job.userId,
      tier: tier,
      extractedText: job.data.extractedText?.substring(0, 10000),
      aiResponse: {
        model: aiResult.aiResponse?.model,
        promptVersion: '1.0',
        completionTokens: aiResult.aiResponse?.completionTokens,
        totalTokens: aiResult.aiResponse?.totalTokens,
        finishReason: aiResult.aiResponse?.finishReason,
        rawOutput: aiResult
      },
      metadata: {
        extractionMethod: job.data?.extractionMethod || 'text_extraction',
        ocrConfidence: job.data?.ocrConfidence,
        pageCount: job.data?.pageCount || 1,
        processingTimeMs: 0
      },
      generatedAt: new Date()
    };

    const relevance = aiResult.relevance || { isRelevant: true };

    if (relevance.isRelevant === false) {
      // Irrelevant Document Handling
      resultData = {
        ...resultData,
        summary: relevance.rejectionMessage || `This platform is not for ${relevance.topic || 'this type of document'}.`,
        verdict: 'irrelevant',
        verdictScore: 0,
        isIrrelevant: true,
        detailedReview: 'Analysis skipped because the document is not a renovation quote.',
        redFlags: [],
        questionsToAsk: []
      };

      // Usage Refund Logic
      if (resultData.userId) {
        this.handleUsageRefund(resultData.userId, tier).catch(err => {
          logger.error(`Failed to refund usage for user ${resultData.userId}:`, err);
        });
      }
    } else if (tier.toLowerCase() === 'free') {
      const verdict = aiResult.verdict || {};
      resultData = {
        ...resultData,
        summary: aiResult.freeSummary?.overview || 'Quote overview generated.',
        verdict: this.normalizeVerdict(verdict.label, verdict.score),
        verdictScore: verdict.score !== undefined ? (verdict.score > 10 ? verdict.score / 10 : verdict.score) : 7.0,
        verdictJustification: verdict.reasoning || null,
        overallCost: aiResult.costs?.overall || 0,
        labourCost: aiResult.costs?.labour || 0,
        materialsCost: aiResult.costs?.materials || 0,
        supplierInfo: aiResult.contractorProfile,
        detailedReview: aiResult.freeSummary?.mainPoints?.join('\n') || '',
        redFlags: (aiResult.redFlags || []).map(flag => ({
          title: flag.description?.substring(0, 50) + '...' || 'Red Flag',
          description: flag.description,
          severity: flag.severity || 'medium',
          category: flag.category || 'general'
        })),
        questionsToAsk: (aiResult.questionsToAsk || []).map(q => ({
          question: typeof q === 'string' ? q : (q.question || 'Please clarify'),
          category: q.category || 'general',
          importance: q.importance || 'should-ask'
        })),
        analysisAccuracy: 80,
        confidence: 90
      };
    } else {
      // Standard/Premium
      const analysis = aiResult.analysis || {};
      const verdict = analysis.verdict || {};

      resultData = {
        ...resultData,
        summary: analysis.summary || 'Detailed quote analysis completed.',
        verdict: this.normalizeVerdict(verdict.label, verdict.score),
        verdictScore: verdict.score !== undefined ? (verdict.score > 10 ? verdict.score / 10 : verdict.score) : 8.0,
        verdictJustification: verdict.reasoning || null,
        detailedReview: analysis.detailedReview || null,
        overallCost: analysis.costBreakdown?.reduce((sum, item) => sum + (item.amount || 0), 0),
        costBreakdown: analysis.costBreakdown?.map(item => ({
          description: item.item,
          totalPrice: item.amount,
          category: item.category,
          flagged: item.notes?.toLowerCase().includes('red flag') || (item.amount && item.amount > 0 && false) // Logic for flag can be smarter
        })),
        redFlags: (analysis.redFlags || []).map(flag => ({
          title: flag.description?.substring(0, 50) + '...' || flag.category?.replace('_', ' ').toUpperCase() || 'Red Flag',
          description: flag.description,
          severity: flag.severity || 'medium',
          category: flag.category || 'general',
          recommendation: flag.recommendation
        })),
        questionsToAsk: (analysis.questionsToAsk || []).map(q => ({
          question: typeof q === 'string' ? q : (q.question || 'Please clarify'),
          category: q.category || 'general',
          importance: q.importance || 'should-ask'
        })),
        supplierInfo: analysis.contractorProfile,
        analysisAccuracy: 95,
        confidence: 95
      };
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

  /**
   * Refund / Revert usage if document is irrelevant
   */
  async handleUsageRefund(userId, tier) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      if (tier.toLowerCase() === 'free') {
        // Reset free report date to allow another one this month
        user.subscription.freeReportDate = null;
        await user.save();
        logger.info(`Free usage refunded for user ${userId} due to irrelevant document`);
      } else {
        // Increment credit back
        user.subscription.credits += 1;
        await user.save();
        logger.info(`Credit refunded for user ${userId} due to irrelevant document. New balance: ${user.subscription.credits}`);
      }
    } catch (error) {
      logger.error(`Usage refund error for user ${userId}:`, error);
    }
  }
}

module.exports = new AIProcessor();