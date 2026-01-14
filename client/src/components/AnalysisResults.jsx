import React, { useState } from 'react';
import { Lock, Unlock, ChevronDown, ChevronUp, Zap, Crown, Star, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import quoteApi from '../services/quoteApi';
import { toast } from 'react-hot-toast';

const AnalysisResults = ({ jobResult, userTier = 'free' }) => {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    redFlags: false,
    detailedReview: false,
    questions: false,
    comparison: false,
    benchmarking: false,
    recommendations: false
  });
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleRatingSubmit = async (value) => {
    if (!jobResult?.jobId || ratingSubmitted) return;

    try {
      setIsSubmittingRating(true);
      await quoteApi.submitRating(jobResult.jobId, value);
      setRating(value);
      setRatingSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (err) {
      console.error('Failed to submit rating:', err);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Sample/mock data for demonstration
  const mockJobResult = {
    summary: "This is a comprehensive bathroom renovation quote from a licensed plumber. The quote includes quality materials with a mix of mid-range and premium fixtures, reasonable labor costs, and clear itemization. The scope covers complete fixture replacement with new connections and testing. Overall, this represents fair market pricing for the work described.",
    verdict: "good",
    verdictScore: 78,
    overallCost: 7458,
    labourCost: 2280,
    materialsCost: 4500,
    fairPriceRange: { min: 6500, max: 8500 },
    costBreakdown: [
      {
        description: "Labor - Bathroom Installation (3 days @ $95/hour)",
        quantity: 24,
        unitPrice: 95,
        totalPrice: 2280,
        category: "labor",
        flagged: false
      },
      {
        description: "Caroma Solus Wall-Mounted Toilet Suite",
        quantity: 1,
        unitPrice: 580,
        totalPrice: 580,
        category: "fixtures",
        flagged: false
      },
      {
        description: "Caroma Liano 1700mm Freestanding Bath",
        quantity: 1,
        unitPrice: 1200,
        totalPrice: 1200,
        category: "fixtures",
        flagged: false
      },
      {
        description: "Custom 1500mm Double Vanity with Stone Top",
        quantity: 1,
        unitPrice: 1500,
        totalPrice: 1500,
        category: "fixtures",
        flagged: false
      },
      {
        description: "Astra Walker Icon Mixer Tap Set",
        quantity: 1,
        unitPrice: 340,
        totalPrice: 340,
        category: "fixtures",
        flagged: false
      },
      {
        description: "Plumbing Fittings, Connections & Testing",
        quantity: 1,
        unitPrice: 800,
        totalPrice: 800,
        category: "materials",
        flagged: false
      }
    ],
    redFlags: [
      {
        title: "Old fixture disposal not explicitly mentioned",
        description: "Verify whether the quote includes cost of removing and disposing of old bathroom fixtures. This can add $300-500 if not included.",
        severity: "medium",
        category: "scope"
      },
      {
        title: "Warranty period is relatively short",
        description: "5-year warranty on workmanship is standard but industry best practice is 7-10 years. Consider negotiating for an extended warranty.",
        severity: "low",
        category: "warranty"
      },
      {
        title: "No contingency for structural issues",
        description: "Quote doesn't mention what happens if water damage or mold is discovered during installation. Clarify responsibility and additional costs.",
        severity: "medium",
        category: "risk"
      }
    ],
    questionsToAsk: [
      {
        question: "Is the removal and disposal of old bathroom fixtures included in this quote, or will there be additional charges?",
        category: "scope",
        importance: "must-ask"
      },
      {
        question: "What is the breakdown of warranty - is it 5 years on both labor AND all fixtures, or separately?",
        category: "warranty",
        importance: "must-ask"
      },
      {
        question: "Will you provide a detailed timeline showing when different trades will be on site (plumber, painter, tiler)?",
        category: "timeline",
        importance: "must-ask"
      },
      {
        question: "What is your contingency process and additional cost if we discover water damage or mold behind the walls?",
        category: "risk",
        importance: "should-ask"
      },
      {
        question: "Are plaster repairs after chasing walls for pipes included, or is that quoted separately?",
        category: "scope",
        importance: "should-ask"
      },
      {
        question: "What is the payment schedule - full upfront, installments, or 50/50 deposit?",
        category: "payment",
        importance: "should-ask"
      }
    ],
    detailedReview: `Quote Analysis Summary:\n\nThe quote demonstrates Standard preparation with itemized costs and clear material selections. Labor at $95/hour is competitive for Sydney (market range: $80-120/hour). \n\nMaterial Pricing:\n• Caroma Solus toilet ($580) - Fair price, standard quality\n• Freestanding bath ($1200) - Mid-range pricing\n• Double vanity with stone ($1500) - Premium selection\n• Mixer set ($340) - Good value for Astra Walker brand\n\nStrengths:\n✓ Detailed itemization\n✓ Quality brand selections\n✓ Includes warranty\n✓ Clear scope of work\n\nConcerns:\n⚠ Disposal costs unclear\n⚠ Timeline not detailed\n⚠ Contingency plan not mentioned`,
    recommendations: [
      {
        title: "Negotiate fixture disposal inclusion",
        description: "Request that old fixture removal and responsible disposal be included at no extra cost. This is a standard practice and could save $300-500.",
        potentialSavings: 400,
        difficulty: "easy"
      },
      {
        title: "Request extended warranty",
        description: "Ask for 7-year warranty on labor (vs 5 years) in exchange for committing to payment terms. This small concession often costs the tradie nothing but adds value.",
        potentialSavings: 0,
        difficulty: "easy"
      },
      {
        title: "Ask about references for similar work",
        description: "Request contact details for 2-3 recent bathroom renovations they've completed. Verify quality and confirm timeline accuracy.",
        potentialSavings: 0,
        difficulty: "easy"
      },
      {
        title: "Clarify contingency plan upfront",
        description: "Get written agreement on process and costs if water damage/mold is discovered. Protects both parties and prevents surprise charges.",
        potentialSavings: 0,
        difficulty: "moderate"
      }
    ],
    benchmarking: [
      {
        item: "Labor Rate (per hour)",
        quotePrice: 95,
        marketMin: 80,
        marketAvg: 95,
        marketMax: 120,
        percentile: 48
      },
      {
        item: "Toilet Suite Cost",
        quotePrice: 580,
        marketMin: 400,
        marketAvg: 650,
        marketMax: 900,
        percentile: 32
      },
      {
        item: "Freestanding Bath",
        quotePrice: 1200,
        marketMin: 800,
        marketAvg: 1200,
        marketMax: 1800,
        percentile: 50
      },
      {
        item: "Overall Project Cost",
        quotePrice: 7458,
        marketMin: 6500,
        marketAvg: 7800,
        marketMax: 9200,
        percentile: 46
      }
    ],
    marketContext: {
      city: "Sydney, NSW",
      tradeType: "Plumbing",
      projectType: "Bathroom Renovation",
      averageQuoteValue: 7800,
      pricePercentile: 46
    }
  };

  // Use mock data if jobResult is not provided
  const displayResult = jobResult || mockJobResult;

  // Normalize tier names to lowercase
  const normalizedTier = userTier?.toLowerCase() === 'Standard' ? 'standard' :
    userTier?.toLowerCase() === 'Premium' ? 'premium' :
      userTier?.toLowerCase() || 'free';

  // Tier access mapping
  const tierAccess = {
    free: ['summary', 'verdict'],
    standard: ['summary', 'verdict', 'redFlags', 'detailedReview', 'questions'],
    premium: ['summary', 'verdict', 'redFlags', 'detailedReview', 'questions', 'comparison', 'benchmarking', 'recommendations']
  };

  const currentTierAccess = tierAccess[normalizedTier] || tierAccess.free;

  // Feature definitions
  const features = {
    summary: {
      title: 'Basic Summary',
      description: 'AI-generated overview of your quote',
      icon: '📋',
      tier: 'free',
      content: displayResult?.summary || 'Processing summary...'
    },
    verdict: {
      title: 'Fair Price Verdict',
      description: 'Assessment of pricing fairness',
      icon: '⚖️',
      tier: 'free',
      content: displayResult?.verdict || 'Analyzing pricing...'
    },
    redFlags: {
      title: 'Red Flags & Concerns',
      description: 'Potential issues identified in the quote',
      icon: '🚩',
      tier: 'standard',
      content: displayResult?.redFlags || [],
      isList: true
    },
    detailedReview: {
      title: 'Detailed Cost Review',
      description: 'Line-by-line breakdown of all costs',
      icon: '🔍',
      tier: 'standard',
      content: displayResult?.detailedReview || 'Performing detailed analysis...',
      isList: false
    },
    questions: {
      title: 'Questions to Ask',
      description: 'Important questions to clarify with the tradie',
      icon: '❓',
      tier: 'standard',
      content: displayResult?.questionsToAsk || [],
      isList: true
    },
    comparison: {
      title: 'Quote Comparison',
      description: 'Side-by-side analysis of multiple quotes',
      icon: '📊',
      tier: 'premium',
      content: displayResult?.comparison || 'Upload additional quotes to compare',
      isList: false
    },
    benchmarking: {
      title: 'Market Benchmarking',
      description: 'Compare against local market rates',
      icon: '📈',
      tier: 'premium',
      content: displayResult?.benchmarking || 'Market data loading...',
      isList: false
    },
    recommendations: {
      title: 'Advanced Recommendations',
      description: 'AI-powered negotiation tips and savings opportunities',
      icon: '💡',
      tier: 'premium',
      content: displayResult?.recommendations || [],
      isList: true
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getTierLabel = (requiredTier) => {
    if (requiredTier === 'free') return null;
    if (requiredTier === 'standard') return 'Standard';
    if (requiredTier === 'premium') return 'Premium';
  };

  const getTierColor = (requiredTier) => {
    if (requiredTier === 'standard') return 'from-orange-500 to-amber-600';
    if (requiredTier === 'premium') return 'from-black to-gray-900';
    return '';
  };

  const getTierIcon = (requiredTier) => {
    if (requiredTier === 'standard') return <Zap className="w-4 h-4" />;
    if (requiredTier === 'premium') return <Crown className="w-4 h-4" />;
    return null;
  };

  const isFeatureUnlocked = (featureKey) => {
    return currentTierAccess.includes(featureKey);
  };

  const renderFeatureContent = (feature, featureKey) => {
    const isUnlocked = isFeatureUnlocked(featureKey);

    if (!isUnlocked) {
      return (
        <div className="text-center py-8">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            This feature is locked for {userTier === 'free' ? 'free' : userTier} tier users
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Unlock with <strong>{getTierLabel(feature.tier)} Plan</strong>
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              {getTierIcon(feature.tier)}
              Upgrade to {getTierLabel(feature.tier)}
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {feature.isList ? (
          <ul className="space-y-3">
            {Array.isArray(feature.content) ? (
              feature.content.map((item, index) => {
                // Handle different item types
                let displayText = item;
                let displaySubtext = null;
                let category = null;

                if (typeof item === 'string') {
                  displayText = item;
                } else if (item.question) {
                  // Question object
                  displayText = `${item.question}`;
                  category = item.category;
                } else if (item.title) {
                  // Recommendation or red flag object
                  displayText = `${item.title}`;
                  displaySubtext = item.description;
                  category = item.category;
                  if (item.potentialSavings && item.potentialSavings > 0) {
                    displaySubtext = `${displaySubtext} • Potential savings: $${item.potentialSavings}`;
                  }
                } else if (item.description) {
                  // Generic object with description
                  displayText = item.description;
                }

                return (
                  <li key={index} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all">
                    <span className="text-lg mt-0.5 flex-shrink-0">✓</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{displayText}</p>
                      {displaySubtext && (
                        <p className="text-sm text-gray-600 mt-1">{displaySubtext}</p>
                      )}
                      {category && (
                        <p className="text-xs text-orange-600 font-medium mt-2 inline-block px-2.5 py-1 bg-orange-50 rounded">
                          {category}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="text-gray-600 p-4 bg-white border border-gray-200 rounded-lg">{feature.content}</li>
            )}
          </ul>
        ) : (
          <div className="p-5 bg-white border border-gray-200 rounded-lg text-gray-700 whitespace-pre-wrap font-normal leading-relaxed text-sm">
            {feature.content}
          </div>
        )}
      </div>
    );
  };

  const renderFeatureCard = (featureKey, feature) => {
    const isUnlocked = isFeatureUnlocked(featureKey);
    const isExpanded = expandedSections[featureKey];
    const tierColor = getTierColor(feature.tier);
    const tierLabel = getTierLabel(feature.tier);

    return (
      <div
        key={featureKey}
        className={`border rounded-xl overflow-hidden transition-all ${isUnlocked
          ? 'bg-white border-gray-200 hover:shadow-lg'
          : 'bg-gray-50 border-gray-300'
          }`}
      >
        {/* Header */}
        <button
          onClick={() => toggleSection(featureKey)}
          className={`w-full p-4 sm:p-6 flex items-center justify-between transition-colors ${isUnlocked ? 'hover:bg-gray-50' : 'hover:bg-gray-100 cursor-default'
            }`}
        >
          <div className="flex items-start gap-4 flex-1 text-left">
            <span className="text-3xl mt-1">{feature.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {feature.title}
                </h3>
                {!isUnlocked && (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${tierColor}`}>
                    {getTierIcon(feature.tier)}
                    <span>{tierLabel}</span>
                  </div>
                )}
                {isUnlocked && feature.tier !== 'free' && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${tierColor}`}>
                    {getTierIcon(feature.tier)}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>

          <div className="ml-4 flex-shrink-0">
            {isUnlocked ? (
              <>
                <Unlock className="w-5 h-5 text-green-500" />
              </>
            ) : (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Content - Only show if unlocked and expanded */}
        {isUnlocked && isExpanded && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-white">
            {renderFeatureContent(feature, featureKey)}
          </div>
        )}

        {/* Locked Content Indicator */}
        {!isUnlocked && isExpanded && (
          <div className="p-4 sm:p-6 border-t border-gray-200">
            {renderFeatureContent(feature, featureKey)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tier Information Banner */}
      {normalizedTier === 'free' && (
        <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 mb-1">You're on the Free Tier</h3>
              <p className="text-sm text-gray-700 mb-3">
                Upgrade to Standard or Premium to unlock detailed analysis, red flag detection, and more.
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
              >
                <Zap className="w-4 h-4" />
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}

      {normalizedTier === 'standard' && (
        <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 mb-1">You're on the Standard Plan</h3>
              <p className="text-sm text-gray-700 mb-3">
                Unlock Advanced Recommendations and Quote Comparison with the Premium plan.
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition-all"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="space-y-4">
        {renderFeatureCard('summary', features.summary)}
        {renderFeatureCard('verdict', features.verdict)}
        {renderFeatureCard('redFlags', features.redFlags)}
        {renderFeatureCard('detailedReview', features.detailedReview)}
        {renderFeatureCard('questions', features.questions)}
        {renderFeatureCard('comparison', features.comparison)}
        {renderFeatureCard('benchmarking', features.benchmarking)}
        {renderFeatureCard('recommendations', features.recommendations)}
      </div>

      {/* Rating Section */}
      <div className="mt-12 p-8 bg-white border border-gray-200 rounded-2xl text-center shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-2">How helpful was this analysis?</h3>
        <p className="text-gray-600 mb-6 font-normal">Your feedback helps us improve our AI insights.</p>

        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={ratingSubmitted || isSubmittingRating}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => handleRatingSubmit(star)}
              className={`p-1 transition-all transform hover:scale-110 ${(hoveredRating || rating) >= star ? 'text-orange-500' : 'text-gray-300'
                } ${(ratingSubmitted || isSubmittingRating) ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <Star className={`w-10 h-10 ${((hoveredRating || rating) >= star) ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>

        {ratingSubmitted && (
          <p className="text-green-600 font-medium">Feedback received! Thank you.</p>
        )}
      </div>

      {/* Action Bar */}
      <div className="mt-8 flex flex-wrap gap-4 items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Download className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Original Document</h4>
            <p className="text-sm text-gray-600">Download the original quote for your records</p>
          </div>
        </div>
        <button
          onClick={async () => {
            if (!jobResult?.jobId) return;
            try {
              const job = await quoteApi.getJob(jobResult.jobId);
              if (job && job.documents?.length > 0) {
                const docId = job.documents[0]._id || job.documents[0];
                const data = await quoteApi.downloadDocument(jobResult.jobId, docId);
                if (data.url) window.open(data.url, '_blank');
              } else {
                toast.error('No document found for this analysis');
              }
            } catch (err) {
              console.error('Download error:', err);
              toast.error('Failed to download document');
            }
          }}
          className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md active:scale-95"
        >
          Download PDF
        </button>
      </div>

      {/* Footer CTA */}
      {(normalizedTier === 'free' || normalizedTier === 'standard') && (
        <div className="mt-8 p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-center">
          <Crown className="w-8 h-8 text-gray-900 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {normalizedTier === 'free'
              ? 'Get Full Analysis with Standard or Premium'
              : 'Unlock Advanced Features with Premium'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {normalizedTier === 'free'
              ? 'Upgrade to see red flags, detailed cost breakdown, questions to ask, and more.'
              : 'Upgrade to Premium to compare multiple quotes and get market benchmarking.'}
          </p>
          <Link
            to="/pricing"
            className={`inline-flex items-center gap-2 px-8 py-3 text-white rounded-xl font-bold text-lg transition-all hover:shadow-lg ${normalizedTier === 'free'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:shadow-orange-500/30'
              : 'bg-black hover:bg-gray-900'
              }`}
          >
            {normalizedTier === 'free' ? (
              <>
                <Zap className="w-5 h-5" />
                Upgrade Now
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                Go Premium
              </>
            )}
          </Link>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
