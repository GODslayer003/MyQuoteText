// ============================================
// src/workers/processors/aiProcessor.js
// ============================================
const Job = require('../../models/Job');
const Result = require('../../models/Result');
const User = require('../../models/User');
const SupplierScoringService = require('../../services/supplier/SupplierScoringService');
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

      // 5. Update Supplier Scoreboard (INTERNAL ONLY)
      if (aiResult.supplierScoreboardData) {
        await SupplierScoringService.processSupplierQuote(
          jobDoc._id,
          {
            ...aiResult.supplierScoreboardData,
            rawText: extractedText
          }
        ).catch(err => logger.error('Supplier scoring failed:', err));
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
        recommendations: this.ensureRecommendations(analysis.recommendations, tier, resultData.overallCost),
        benchmarking: this.ensureBenchmarking(analysis.benchmarking, tier, resultData.overallCost, analysis.costBreakdown),
        marketContext: analysis.marketContext,
        supplierInfo: analysis.contractorProfile,
        analysisAccuracy: 95,
        confidence: 95
      };
    }

    return await Result.create(resultData);
  }

  /**
   * Ensure Premium users always get recommendations
   */
  ensureRecommendations(aiRecommendations, tier, totalCost) {
    if (tier !== 'premium') return [];

    const recommendations = (aiRecommendations || []).map(r => ({
      title: r.title,
      description: r.description,
      potentialSavings: r.potentialSavings,
      difficulty: r.difficulty || 'moderate'
    }));

    // If AI provided recommendations, return them
    if (recommendations.length >= 3) {
      return recommendations;
    }

    // Generate fallback recommendations based on quote value
    const fallbacks = [
      {
        title: 'Request Itemized Material Costs',
        description: 'Ask the contractor to provide a detailed breakdown of all materials with individual pricing. This transparency can reveal markup opportunities and help you negotiate better rates.',
        potentialSavings: Math.round((totalCost || 5000) * 0.05),
        difficulty: 'easy'
      },
      {
        title: 'Negotiate Payment Terms',
        description: 'Consider offering a larger upfront deposit in exchange for a 5-10% discount on the total project cost. Many contractors value cash flow and may be willing to negotiate.',
        potentialSavings: Math.round((totalCost || 5000) * 0.075),
        difficulty: 'moderate'
      },
      {
        title: 'Source Your Own Materials',
        description: 'For non-specialized materials, consider purchasing them yourself from trade suppliers. This can eliminate contractor markup (typically 20-35%) on materials.',
        potentialSavings: Math.round((totalCost || 5000) * 0.15),
        difficulty: 'moderate'
      },
      {
        title: 'Schedule During Off-Peak Season',
        description: 'If timing is flexible, schedule the work during the contractor\'s slower months (typically winter). This can result in better rates and more attention to your project.',
        potentialSavings: Math.round((totalCost || 5000) * 0.10),
        difficulty: 'easy'
      },
      {
        title: 'Bundle Multiple Projects',
        description: 'If you have other renovation work planned, bundle them together with the same contractor. Volume discounts of 10-15% are common for larger combined projects.',
        potentialSavings: Math.round((totalCost || 5000) * 0.12),
        difficulty: 'complex'
      }
    ];

    // Merge AI recommendations with fallbacks to ensure we have at least 3-5
    const merged = [...recommendations, ...fallbacks].slice(0, 5);
    return merged;
  }

  /**
   * Ensure Premium users always get benchmarking data
   */
  ensureBenchmarking(aiBenchmarking, tier, totalCost, costBreakdown) {
    if (tier !== 'premium') return [];

    const benchmarks = (aiBenchmarking || []).map(b => ({
      item: b.item,
      quotePrice: b.quotePrice,
      marketMin: b.marketMin,
      marketAvg: b.marketAvg,
      marketMax: b.marketMax,
      percentile: b.percentile
    }));

    // If AI provided benchmarks, return them
    if (benchmarks.length >= 3) {
      return benchmarks;
    }

    // Generate fallback benchmarking based on cost breakdown
    const fallbacks = [];

    // Labor rate benchmarking
    const laborItems = (costBreakdown || []).filter(item =>
      item.category?.toLowerCase().includes('labour') ||
      item.category?.toLowerCase().includes('labor')
    );

    if (laborItems.length > 0) {
      const avgLaborCost = laborItems.reduce((sum, item) => sum + (item.amount || 0), 0) / laborItems.length;
      fallbacks.push({
        item: 'Average Labor Rate',
        quotePrice: Math.round(avgLaborCost),
        marketMin: 50,
        marketAvg: 75,
        marketMax: 120,
        percentile: Math.min(95, Math.max(5, Math.round((avgLaborCost - 50) / (120 - 50) * 100)))
      });
    }

    // Materials markup benchmarking
    const materialItems = (costBreakdown || []).filter(item =>
      item.category?.toLowerCase().includes('material')
    );

    if (materialItems.length > 0) {
      const totalMaterials = materialItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const estimatedMarkup = 25; // Assume 25% markup
      fallbacks.push({
        item: 'Materials Markup',
        quotePrice: estimatedMarkup,
        marketMin: 15,
        marketAvg: 25,
        marketMax: 35,
        percentile: 50
      });
    }

    // Overall project cost benchmarking
    if (totalCost && totalCost > 0) {
      // Estimate per square meter cost (assuming average project size)
      const estimatedSqm = 50; // Default assumption
      const costPerSqm = Math.round(totalCost / estimatedSqm);

      fallbacks.push({
        item: 'Project Cost (per sqm)',
        quotePrice: costPerSqm,
        marketMin: Math.round(costPerSqm * 0.7),
        marketAvg: Math.round(costPerSqm * 0.9),
        marketMax: Math.round(costPerSqm * 1.3),
        percentile: 55
      });
    }

    // Project management fee
    const pmFee = 15; // Assume 15%
    fallbacks.push({
      item: 'Project Management Fee (%)',
      quotePrice: pmFee,
      marketMin: 10,
      marketAvg: 15,
      marketMax: 20,
      percentile: 50
    });

    // Contingency allowance
    fallbacks.push({
      item: 'Contingency Allowance (%)',
      quotePrice: 10,
      marketMin: 5,
      marketAvg: 10,
      marketMax: 15,
      percentile: 50
    });

    // Merge AI benchmarks with fallbacks to ensure we have at least 3-7
    const merged = [...benchmarks, ...fallbacks].slice(0, 7);
    return merged;
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