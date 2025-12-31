// client/src/pages/Pricing.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  FileText,
  Lock,
  Star,
  Sparkles,
  ArrowRight,
  Target,
  Scale,
  Eye,
  Download,
  Crown,
  ChevronRight,
  Award,
  TrendingUp,
  Users,
  Clock,
  HelpCircle,
  Check,
  AlertCircle,
  BarChart3,
  Repeat,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  ShieldCheck,
  Calendar,
  FileCheck,
  RefreshCw,
  Globe
} from 'lucide-react';

// Payment Modal Component
const PaymentModal = ({ isOpen, onClose, plan }) => {
  const [selectedPlan, setSelectedPlan] = useState(plan === 'enterprise' ? 'enterprise' : 'professional');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const plans = {
    professional: {
      name: 'Professional',
      price: 7.99,
      icon: <Zap className="w-6 h-6" />,
      color: 'from-orange-500 to-amber-600',
      features: [
        'Complete AI analysis of 1 quote',
        'Detailed cost breakdown',
        'Item-by-item assessment',
        'Professional PDF export',
        'Save & organize quote',
        'Priority email support',
        '30-day access to report'
      ],
      description: 'Perfect for single quote analysis'
    },
    enterprise: {
      name: 'Enterprise',
      price: 9.99,
      icon: <Crown className="w-6 h-6" />,
      color: 'from-black to-gray-900',
      features: [
        'Everything in Professional',
        'Compare 2-3 quotes side-by-side',
        'Market rate benchmarking',
        'Advanced recommendations',
        'Priority 24h processing',
        'Bulk upload (up to 3 quotes)',
        'Trend analysis reports',
        'Export to spreadsheet'
      ],
      description: 'Best for complex projects with multiple quotes'
    }
  };

  const currentPlan = plans[selectedPlan];

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentPlan.color} flex items-center justify-center`}>
              {currentPlan.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Get {currentPlan.name} Report</h2>
              <p className="text-gray-600">{currentPlan.description}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Success Message */}
          {isSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">Payment Successful!</h3>
                  <p className="text-green-700 text-sm">Your {currentPlan.name.toLowerCase()} report is being processed.</p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Select Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedPlan('professional')}
                className={`p-4 rounded-xl border-2 transition-all ${selectedPlan === 'professional'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">Professional</span>
                  <span className="text-2xl font-bold text-gray-900">$7.99</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">per report</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Complete AI analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Detailed PDF report</span>
                  </li>
                </ul>
              </button>

              <button
                onClick={() => setSelectedPlan('enterprise')}
                className={`p-4 rounded-xl border-2 transition-all ${selectedPlan === 'enterprise'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">Enterprise</span>
                  <span className="text-2xl font-bold text-gray-900">$9.99</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">per report</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Multiple quote comparison</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Market benchmarking</span>
                  </li>
                </ul>
              </button>
            </div>
          </div>

          {/* Features Comparison */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">What You'll Get</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="space-y-3">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 ${paymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }`}
              >
                <Globe className="w-5 h-5" />
                <span>Stripe</span>
              </button>
            </div>
          </div>

          {/* Security & Guarantee */}
          <div className="mb-8">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-500" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-500" />
                <span>One-time payment</span>
              </div>
            </div>
          </div>

          {/* Total & Payment Button */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-3xl font-bold text-gray-900">${currentPlan.price.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Includes GST</div>
                <div className="text-sm font-medium">One-time payment</div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${selectedPlan === 'professional'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:shadow-xl hover:shadow-orange-500/30'
                  : 'bg-black hover:bg-gray-900'
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Payment...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  Pay ${currentPlan.price.toFixed(2)} Now
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              By proceeding, you agree to our{' '}
              <a href="#" className="text-orange-600 hover:text-orange-500">Terms of Service</a> and{' '}
              <a href="#" className="text-orange-600 hover:text-orange-500">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pricing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handlePlanSelect = (plan) => {
    setSelectedPlanForPayment(plan);
    setShowPaymentModal(true);
  };

  const plans = [
    {
      name: "Explorer",
      tagline: "Start with confidence",
      price: "$0",
      period: "forever",
      popular: false,
      color: "from-gray-800 to-black",
      textColor: "text-gray-800",
      border: "border-gray-300",
      button: "bg-black hover:bg-gray-900 text-white",
      cta: "Get Started Free",
      icon: <Eye className="w-6 h-6" />,
      features: [
        { included: true, text: "Basic AI summary analysis" },
        { included: true, text: "Fair price verdict" },
        { included: true, text: "Essential questions to ask" },
        { included: false, text: "Red flag detection", premium: false},
        { included: false, text: "Detailed cost breakdown", premium: false },
        { included: false, text: "Professional PDF reports", premium: false },
        { included: false, text: "Market benchmarking", premium: true },
        { included: false, text: "Multiple quote comparison", premium: true },
        { included: false, text: "Priority 24h processing", premium: true },
      ],
      limitations: [
        "Summary-only reports",
        "No detailed analysis",
        "No PDF downloads"
      ],
      bestFor: "Quick checks, basic validation"
    },
    {
      name: "Professional",
      tagline: "For confident decisions",
      price: "$7.99",
      period: "per report",
      popular: true,
      color: "from-orange-500 to-amber-600",
      textColor: "text-orange-600",
      border: "border-orange-300",
      button: "from-orange-500 to-amber-600 hover:shadow-orange-500/30 text-white",
      cta: "Get Professional Report",
      icon: <Zap className="w-6 h-6" />,
      features: [
        { included: true, text: "Complete AI analysis" },
        { included: true, text: "Detailed cost breakdown" },
        { included: true, text: "Item-by-item assessment" },
        { included: true, text: "Professional PDF export" },
        { included: true, text: "Save & organize quotes" },
        { included: true, text: "Red Flag detection" },
        { included: false, text: "Multiple quote comparison", premium: true },
        { included: false, text: "Market benchmarking", premium: true },
        { included: false, text: "Priority 24h processing", premium: true },
      ],
      savings: "One-time payment",
      included: "Everything in Explorer, plus:",
      bestFor: "Single quotes, detailed analysis"
    },
    {
      name: "Enterprise",
      tagline: "Master complex projects",
      price: "$9.99",
      period: "per report",
      popular: false,
      color: "from-black to-gray-900",
      textColor: "text-black",
      border: "border-gray-800",
      button: "bg-black hover:bg-gray-900 text-white",
      cta: "Get Enterprise Report",
      icon: <Crown className="w-6 h-6" />,
      features: [
        { included: true, text: "Everything in Professional" },
        { included: true, text: "Compare 2-3 quotes side-by-side" },
        { included: true, text: "Market rate benchmarking" },
        { included: true, text: "Advanced recommendations" },
        { included: true, text: "Priority 24h processing" },
        { included: true, text: "Bulk upload (up to 3 quotes)" },
        { included: true, text: "Trend analysis reports" },
        { included: true, text: "Dedicated support channel" },
        { included: true, text: "Export to spreadsheet" },
      ],
      savings: "One-time payment",
      included: "Everything in Professional, plus:",
      bestFor: "Multiple quotes, complex projects"
    }
  ];

  const tableData = [
    { feature: "AI Summary Analysis", explorer: "✓", professional: "✓", enterprise: "✓" },
    { feature: "Detailed Cost Breakdown", explorer: "—", professional: "✓", enterprise: "✓" },
    { feature: "Professional PDF Export", explorer: "—", professional: "✓", enterprise: "✓" },
    { feature: "Save & Organize Quotes", explorer: "—", professional: "✓", enterprise: "✓" },
    { feature: "Red Flag Detection", explorer: "—", professional: "✓", enterprise: "✓" },
    { feature: "Multiple Quote Comparison", explorer: "—", professional: "—", enterprise: "✓" },
    { feature: "Market Rate Benchmarking", explorer: "—", professional: "—", enterprise: "✓" },
    { feature: "Priority 24h Processing", explorer: "—", professional: "—", enterprise: "✓" },
    { feature: "Bulk Upload (3 quotes)", explorer: "—", professional: "—", enterprise: "✓" },
    { feature: "Trend Analysis Reports", explorer: "—", professional: "—", enterprise: "✓" }
  ];

  const useCases = [
    {
      plan: "Explorer",
      title: "Small Home Repairs",
      description: "Quick validation for minor fixes like painting, plumbing, or electrical work under $1,000.",
      color: "border-gray-200 hover:border-gray-300"
    },
    {
      plan: "Explorer",
      title: "Initial Quote Screening",
      description: "Get a basic read on pricing before committing to detailed analysis.",
      color: "border-gray-200 hover:border-gray-300"
    },
    {
      plan: "Professional",
      title: "Kitchen Renovation",
      description: "Detailed analysis of major renovation quotes with itemized breakdowns.",
      color: "border-orange-200 hover:border-orange-300"
    },
    {
      plan: "Professional",
      title: "Bathroom Remodel",
      description: "Complete assessment of materials, labor, and hidden costs.",
      color: "border-orange-200 hover:border-orange-300"
    },
    {
      plan: "Professional",
      title: "Roof Replacement",
      description: "Ensure fair pricing for high-cost projects with specialized materials.",
      color: "border-orange-200 hover:border-orange-300"
    },
    {
      plan: "Professional",
      title: "Home Addition",
      description: "Validate complex quotes with multiple trades and extended timelines.",
      color: "border-orange-200 hover:border-orange-300"
    },
    {
      plan: "Enterprise",
      title: "Multiple Contractor Quotes",
      description: "Compare 3 different bids for the same project to find the best value.",
      color: "border-gray-800 hover:border-black"
    },
    {
      plan: "Enterprise",
      title: "Whole House Renovation",
      description: "Coordinate multiple trades with timeline and budget optimization.",
      color: "border-gray-800 hover:border-black"
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Homeowner, Kitchen Reno",
      quote: "The Professional plan saved me $4,200 on my kitchen renovation by identifying overpriced materials.",
      savings: "Saved $4,200",
      plan: "Professional"
    },
    {
      name: "James & Lisa T.",
      role: "First-time Homeowners",
      quote: "Enterprise comparison showed us which bathroom quote was inflating labor costs by 30%.",
      savings: "Saved $3,500",
      plan: "Enterprise Plan"
    },
    {
      name: "Michael R.",
      role: "Property Investor",
      quote: "Used Explorer to screen 5 roof quotes, then Professional for detailed analysis. Worth every penny.",
      savings: "Saved $8,700",
      plan: "Both Plans"
    }
  ];

  const faqs = [
    {
      question: "What's the difference between Explorer and Professional?",
      answer: "Explorer gives you a basic summary and red flag detection for free. Professional provides complete, detailed analysis with cost breakdowns and PDF reports."
    },
    {
      question: "Do I need to sign up to use the free Explorer plan?",
      answer: "No, you can upload and analyze quotes instantly without creating an account. Signup is only required to save your reports."
    },
    {
      question: "How do payments work?",
      answer: "You pay per report. Professional is $7.99 per quote analysis, Enterprise is $9.99 for multiple quote comparison. One-time payment, no subscriptions."
    },
    {
      question: "What if I'm not satisfied with my report?",
      answer: "We offer a 30-day money-back guarantee. If our analysis doesn't provide value, we'll refund your payment."
    },
    {
      question: "Can I upgrade from Professional to Enterprise?",
      answer: "Yes, you can upgrade any report to Enterprise for the price difference within 7 days of purchase."
    },
    {
      question: "How long does analysis take?",
      answer: "Explorer reports are instant. Professional reports are typically ready within 24 hours. Enterprise with 24h priority is usually within 4-6 hours."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-orange-50 to-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            NO SUBSCRIPTIONS, PAY PER REPORT
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-black">Simple, Transparent</span>
            <span className="text-orange-600"> Pricing</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Pay only for what you need. Start free, upgrade when you need detailed analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/upload"
              className="group px-8 py-4 bg-black text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
            >
              Check a Quote Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredPlan(index)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${hoveredPlan === index ? 'transform scale-105 shadow-2xl' : 'shadow-lg'
                  } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  } ${plan.popular
                    ? 'border-2 border-orange-500 bg-white'
                    : 'border border-gray-200 bg-white'
                  }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                      <Star className="w-4 h-4 fill-white" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {plan.name === "Enterprise" && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                      <Crown className="w-4 h-4" />
                      BEST VALUE
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.name === "Explorer" ? 'bg-gray-100 text-gray-700' :
                      plan.name === "Professional" ? 'bg-orange-100 text-orange-600' :
                        'bg-black text-white'
                      }`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600 text-sm">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="my-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-sm text-gray-900">{plan.price}</span>
                    </div>
                    <div className="text-gray-600 mt-2 text-sm">{plan.period}</div>
                    {plan.savings && (
                      <div className="text-orange-600 text-sm font-medium mt-2">
                        {plan.savings}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  {plan.name === "Explorer" ? (
                    <Link
                      to="/upload"
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handlePlanSelect(plan.name.toLowerCase())}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${plan.name === "Professional"
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:shadow-xl hover:shadow-orange-500/30 text-white'
                          : 'bg-black hover:bg-gray-900 text-white'
                        }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.included && (
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {plan.included}
                    </div>
                  )}

                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg ${feature.included
                        ? feature.premium
                          ? 'bg-orange-50'
                          : 'bg-gray-50'
                        : 'opacity-50'
                        }`}
                    >
                      {feature.included ? (
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${feature.premium ? 'text-orange-500' : 'text-green-500'
                          }`} />
                      ) : (
                        <XCircle className="w-5 h-5 flex-shrink-0 text-gray-300" />
                      )}
                      <span className={`text-sm ${feature.premium ? 'font-medium text-orange-700' : ''}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Best For & Limitations */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="mb-3">
                    <div className="text-sm font-bold text-gray-700 mb-1">Best for:</div>
                    <div className="text-sm text-gray-600">{plan.bestFor}</div>
                  </div>

                  {plan.limitations && (
                    <div>
                      <div className="text-sm font-bold text-gray-700 mb-1">Limitations:</div>
                      <ul className="space-y-1">
                        {plan.limitations.map((limit, idx) => (
                          <li key={idx} className="text-sm text-gray-500 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            {limit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compare All Features</h2>
            <p className="text-gray-600">See exactly what you get with each plan</p>
          </div>

          {/* Desktop Table (full width on desktop) */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left p-6 font-bold">Feature</th>
                  <th className="text-center p-6 font-bold">Explorer</th>
                  <th className="text-center p-6 font-bold bg-orange-500">Professional</th>
                  <th className="text-center p-6 font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="p-6 font-medium text-gray-900">{row.feature}</td>
                    <td className="text-center p-6">
                      <span className={row.explorer === "✓" ? "text-green-600 font-bold" : "text-gray-400"}>
                        {row.explorer}
                      </span>
                    </td>
                    <td className="text-center p-6 bg-orange-50">
                      <span className={row.professional === "✓" ? "text-orange-600 font-bold" : "text-gray-400"}>
                        {row.professional}
                      </span>
                    </td>
                    <td className="text-center p-6">
                      <span className={row.enterprise === "✓" ? "text-black font-bold" : "text-gray-400"}>
                        {row.enterprise}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Scrollable Table */}
          <div className="lg:hidden">
            {/* Scroll Indicator */}
            <div className="flex justify-center mb-3">
              <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Scroll horizontally to compare</span>
                <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>

            {/* Scrollable Container with Complete Table */}
            <div className="relative">
              <div className="overflow-x-auto rounded-2xl shadow-lg">
                <div className="min-w-[700px] bg-white">
                  {/* Table Headers */}
                  <div className="grid grid-cols-4 border-b-2 border-gray-200">
                    <div className="p-4 bg-black text-white font-bold text-left">
                      Feature
                    </div>
                    <div className="p-4 bg-black text-white font-bold text-center">
                      Explorer
                    </div>
                    <div className="p-4 bg-orange-500 text-white font-bold text-center">
                      Professional
                    </div>
                    <div className="p-4 bg-black text-white font-bold text-center">
                      Enterprise
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="grid grid-cols-4 border-b border-gray-200 bg-gray-50">
                    <div className="p-3 text-sm text-gray-500 font-medium">
                      Monthly Price
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">$0</div>
                      <div className="text-xs text-gray-500">Free forever</div>
                    </div>
                    <div className="p-3 text-center bg-orange-50">
                      <div className="text-2xl font-bold text-orange-600">$7.99</div>
                      <div className="text-xs text-orange-500">Most popular</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">$9.99</div>
                      <div className="text-xs text-gray-500">Best value</div>
                    </div>
                  </div>

                  {/* Features Rows */}
                  {tableData.map((row, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-4 border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      {/* Feature Column */}
                      <div className="p-4 font-medium text-gray-900 text-sm flex items-center">
                        {row.feature}
                      </div>

                      {/* Explorer Column */}
                      <div className="p-4 flex items-center justify-center">
                        <span className={row.explorer === "✓" ? "text-green-600 font-bold text-xl" : "text-gray-400 text-xl"}>
                          {row.explorer}
                        </span>
                      </div>

                      {/* Professional Column */}
                      <div className="p-4 bg-orange-50 flex items-center justify-center">
                        <span className={row.professional === "✓" ? "text-orange-600 font-bold text-xl" : "text-gray-400 text-xl"}>
                          {row.professional}
                        </span>
                      </div>

                      {/* Enterprise Column */}
                      <div className="p-4 flex items-center justify-center">
                        <span className={row.enterprise === "✓" ? "text-black font-bold text-xl" : "text-gray-400 text-xl"}>
                          {row.enterprise}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile CTA Buttons */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <Link
                  to="/upload"
                  className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold py-3 px-2 rounded-lg text-center transition-colors"
                >
                  Start Free
                </Link>
                <button
                  onClick={() => handlePlanSelect('professional')}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-bold py-3 px-2 rounded-lg text-center transition-all"
                >
                  Try Pro
                </button>
                <button
                  onClick={() => handlePlanSelect('enterprise')}
                  className="bg-black hover:bg-gray-900 text-white text-sm font-bold py-3 px-2 rounded-lg text-center transition-colors"
                >
                  Go Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perfect Plan For Every Project</h2>
            <p className="text-gray-600">Choose based on your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className={`rounded-xl p-6 border-2 transition-all hover:shadow-lg ${useCase.color}`}
              >
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 ${useCase.plan === "Explorer" ? 'bg-gray-100 text-gray-700' :
                  useCase.plan === "Professional" ? 'bg-orange-100 text-orange-700' :
                    'bg-black text-white'
                  }`}>
                  {useCase.plan}
                </div>
                <h3 className="font-bold text-xl mb-3">{useCase.title}</h3>
                <p className="text-gray-600 mb-4">{useCase.description}</p>
                {useCase.plan === "Explorer" ? (
                  <Link
                    to="/upload"
                    className="inline-flex items-center text-sm font-medium text-gray-700"
                  >
                    Get started <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handlePlanSelect(useCase.plan.toLowerCase())}
                    className={`inline-flex items-center text-sm font-medium ${useCase.plan === "Professional" ? 'text-orange-600' : 'text-gray-700'
                      }`}
                  >
                    Get started <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
              REAL SAVINGS, REAL RESULTS
            </div>
            <h2 className="text-3xl font-bold mb-4">Join Thousands of Happy Homeowners</h2>
            <p className="text-gray-600">See how our plans help save money on renovations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-bold text-lg">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${testimonial.plan.includes("Professional") ? 'bg-orange-100 text-orange-700' :
                    testimonial.plan.includes("Enterprise") ? 'bg-gray-100 text-gray-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                    {testimonial.plan}
                  </div>
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">{testimonial.savings}</div>
                  <div className="flex gap-1 text-orange-500">
                    <Star className="w-5 h-5 fill-orange-500" />
                    <Star className="w-5 h-5 fill-orange-500" />
                    <Star className="w-5 h-5 fill-orange-500" />
                    <Star className="w-5 h-5 fill-orange-500" />
                    <Star className="w-5 h-5 fill-orange-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Got questions? We've got answers</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <HelpCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            READY TO GET STARTED?
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Start Your Free Quote Check
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Upload your first quote now - no signup required for basic analysis
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/upload"
              className="group px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="relative z-10">Check a Quote Free</span>
              <ArrowRight className="inline-block w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPlanForPayment(null);
        }}
        plan={selectedPlanForPayment}
      />
    </div>
  );
};

export default Pricing;
