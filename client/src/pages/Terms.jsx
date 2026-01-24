import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  X,
  Home,
  Zap,
  Eye,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

const Terms = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const termsSections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: <CheckCircle2 className="w-5 h-5" />
    },
    {
      id: 'services',
      title: 'Services Description',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'user-obligations',
      title: 'User Obligations',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'payments',
      title: 'Payments & Fees',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      id: 'disclaimer',
      title: 'Disclaimer',
      icon: <AlertTriangle className="w-5 h-5" />
    },
    {
      id: 'liability',
      title: 'Liability Limitations',
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 'termination',
      title: 'Termination',
      icon: <X className="w-5 h-5" />
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      icon: <Clock className="w-5 h-5" />
    }
  ];

  const termsContent = {
    acceptance: `
      <h2 class="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
      <p class="mb-4 text-gray-600">By accessing and using MyQuoteMate ("the Service"), you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our Service.</p>
      
      <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg mb-4">
        <p class="text-gray-700"><strong>Important:</strong> These terms constitute a legally binding agreement between you and MyQuoteMate Pty Ltd (ABN: XX XXX XXX XXX).</p>
      </div>
      
      <h3 class="font-semibold mb-2">1.1 Eligibility</h3>
      <ul class="list-disc pl-5 space-y-2 mb-4 text-gray-600">
        <li>You must be at least 18 years old to use our Service</li>
        <li>You must have the legal capacity to enter into binding contracts in Australia</li>
        <li>You agree to provide accurate and complete information</li>
      </ul>
      
      <h3 class="font-semibold mb-2">1.2 Service Availability</h3>
      <p class="text-gray-600">Our Service is available to residents of Australia. We may restrict access from other jurisdictions at our discretion.</p>
    `,
    services: `
      <h2 class="text-xl font-bold mb-4">2. Services Description</h2>
      <p class="mb-4 text-gray-600">MyQuoteMate provides AI-powered analysis of tradie quotes for Australian homeowners. Our Service includes:</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">Quote Analysis</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• AI-powered quote review</li>
            <li>• Market price comparisons</li>
            <li>• Red flag identification</li>
            <li>• Detailed breakdowns</li>
          </ul>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">Educational Content</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• Guides and resources</li>
            <li>• Industry benchmarks</li>
            <li>• Best practice advice</li>
            <li>• FAQ and support</li>
          </ul>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-4">
        <h3 class="font-semibold mb-2 text-gray-900">What Our Service Is Not:</h3>
        <ul class="text-gray-600 space-y-2">
          <li class="flex items-start gap-2">
            <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>Not a legal or financial advice service</span>
          </li>
          <li class="flex items-start gap-2">
            <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>Not a substitute for Standard inspections</span>
          </li>
          <li class="flex items-start gap-2">
            <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>Not a guarantee of tradie quality or workmanship</span>
          </li>
        </ul>
      </div>
    `,
    'user-obligations': `
      <h2 class="text-xl font-bold mb-4">3. User Obligations</h2>
      <p class="mb-4 text-gray-600">When using MyQuoteMate, you agree to:</p>
      
      <div class="space-y-4 mb-6">
        <div class="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-1">Provide Accurate Information</h3>
            <p class="text-gray-600 text-sm">Submit only genuine tradie quotes that you have received or are considering.</p>
          </div>
        </div>
        
        <div class="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-1">Respect Intellectual Property</h3>
            <p class="text-gray-600 text-sm">Do not copy, distribute, or misuse our analysis reports without permission.</p>
          </div>
        </div>
        
        <div class="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-1">Comply with Laws</h3>
            <p class="text-gray-600 text-sm">Use our Service in accordance with all applicable Australian laws and regulations.</p>
          </div>
        </div>
      </div>
      
      <div class="bg-red-50 border border-red-200 rounded-xl p-4">
        <h3 class="font-semibold mb-2 text-red-600">Prohibited Activities:</h3>
        <ul class="text-sm text-gray-600 space-y-1">
          <li>• Submitting false or misleading quotes</li>
          <li>• Attempting to reverse-engineer our AI technology</li>
          <li>• Using our Service for commercial resale</li>
          <li>• Sharing login credentials</li>
          <li>• Uploading malicious files</li>
        </ul>
      </div>
    `,
    payments: `
      <h2 class="text-xl font-bold mb-4">4. Payments & Fees</h2>
      
      <div class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 class="font-semibold mb-4 text-gray-900">Pricing Structure</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900 mb-2">$0</div>
            <h4 class="font-medium text-gray-900 mb-1">Free Analysis</h4>
            <p class="text-sm text-gray-600">Basic quote analysis with limited features</p>
          </div>
          <div class="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
            <div class="text-2xl font-bold text-gray-900 mb-2">$7.99</div>
            <h4 class="font-medium text-gray-900 mb-1">Single Analysis</h4>
            <p class="text-sm text-gray-600">One comprehensive quote analysis</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900 mb-2">$9.99</div>
            <h4 class="font-medium text-gray-900 mb-1">Premium Package</h4>
            <p class="text-sm text-gray-600">Credits for 3 analyses & premium features</p>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">4.1 Payment Terms</h3>
          <ul class="text-gray-600 space-y-2">
            <li>• All prices are in Australian Dollars (AUD) and include GST where applicable</li>
            <li>• Payments are processed securely through our third-party payment providers</li>
            <li>• We accept major credit cards and PayPal</li>
            <li>• All charges are non-refundable except as required by Australian Consumer Law</li>
          </ul>
        </div>
        
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">4.2 Refund Policy</h3>
          <p class="text-gray-600 mb-2">We offer a 7-day money-back guarantee if you're not satisfied with our analysis. To request a refund:</p>
          <ul class="text-gray-600 space-y-1">
            <li>• Contact us within 7 days of purchase</li>
            <li>• Provide your order number</li>
            <li>• Explain the reason for dissatisfaction</li>
          </ul>
          <p class="text-sm text-gray-500 mt-3">Refunds are processed within 5-10 business days.</p>
        </div>
      </div>
    `,
    disclaimer: `
      <h2 class="text-xl font-bold mb-4">5. Disclaimer of Warranties</h2>
      
      <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
        <p class="text-gray-700"><strong>Important Disclaimer:</strong> Our Service provides analysis and information only. We do not guarantee the accuracy, completeness, or usefulness of any information provided.</p>
      </div>
      
      <div class="space-y-4">
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">5.1 Nature of Service</h3>
          <p class="text-gray-600">MyQuoteMate's analysis is based on AI algorithms and market data. It is:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-600">
            <li>Informational only, not Standard advice</li>
            <li>Based on available data and algorithms</li>
            <li>Subject to limitations of AI technology</li>
            <li>Not a substitute for Standard judgment</li>
          </ul>
        </div>
        
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">5.2 No Standard Advice</h3>
          <p class="text-gray-600 mb-2">Our Service does not constitute:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span class="text-sm text-gray-600">Legal advice</span>
            </div>
            <div class="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span class="text-sm text-gray-600">Financial advice</span>
            </div>
            <div class="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span class="text-sm text-gray-600">Building inspection</span>
            </div>
            <div class="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span class="text-sm text-gray-600">Contractual advice</span>
            </div>
          </div>
        </div>
      </div>
    `,
    liability: `
      <h2 class="text-xl font-bold mb-4">6. Limitation of Liability</h2>
      
      <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <h3 class="font-semibold mb-2 text-red-600">Important Limitations</h3>
        <p class="text-gray-600">To the maximum extent permitted by Australian law:</p>
      </div>
      
      <div class="space-y-4">
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">6.1 Direct Damages</h3>
          <p class="text-gray-600">MyQuoteMate's total liability to you for any claim arising from or related to these Terms or the Service shall not exceed the amount you paid to MyQuoteMate in the 12 months preceding the claim.</p>
        </div>
        
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">6.2 Indirect Damages</h3>
          <p class="text-gray-600">We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.</p>
        </div>
        
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">6.3 Australian Consumer Law</h3>
          <p class="text-gray-600">Nothing in these Terms excludes, restricts, or modifies any right or remedy, or any guarantee, warranty, or other term or condition, implied or imposed by the Australian Consumer Law which cannot lawfully be excluded or limited.</p>
        </div>
      </div>
    `,
    termination: `
      <h2 class="text-xl font-bold mb-4">7. Termination</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">7.1 By You</h3>
          <p class="text-gray-600">You may terminate your account at any time by:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-600">
            <li>Contacting our support team</li>
            <li>Using the account deletion feature</li>
            <li>Ceasing to use our Service</li>
          </ul>
        </div>
        
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">7.2 By Us</h3>
          <p class="text-gray-600">We may suspend or terminate your access if:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-600">
            <li>You breach these Terms</li>
            <li>Required by law</li>
            <li>For security reasons</li>
            <li>For non-payment</li>
          </ul>
        </div>
      </div>
      
      <div class="p-4 bg-gray-50 rounded-lg">
        <h3 class="font-semibold mb-2 text-gray-900">7.3 Effect of Termination</h3>
        <p class="text-gray-600">Upon termination:</p>
        <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-600">
          <li>Your right to use the Service immediately ceases</li>
          <li>We will delete your data as per our Privacy Policy</li>
          <li>Any outstanding fees remain payable</li>
          <li>Sections that should survive termination will remain in effect</li>
        </ul>
      </div>
    `,
    changes: `
      <h2 class="text-xl font-bold mb-4">8. Changes to Terms</h2>
      
      <div class="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl mb-6">
        <h3 class="font-semibold mb-2 text-gray-900">We May Update These Terms</h3>
        <p class="text-gray-600">We reserve the right to modify these Terms at any time. We will notify you of significant changes.</p>
      </div>
      
      <div class="space-y-4">
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">8.1 Notification of Changes</h3>
          <p class="text-gray-600">We will provide notice of material changes by:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-600">
            <li>Email to registered users</li>
            <li>In-Service notifications</li>
            <li>Updating the "Last Updated" date</li>
            <li>Posting on our website</li>
          </ul>
        </div>
        
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">8.2 Acceptance of Changes</h3>
          <p class="text-gray-600">Your continued use of the Service after changes become effective constitutes acceptance of the new Terms. If you do not agree to the changes, you must stop using our Service.</p>
        </div>
        
        <div class="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 class="font-semibold mb-2 text-gray-900">8.3 Review Responsibility</h3>
          <p class="text-gray-600">It is your responsibility to review these Terms periodically for changes. The "Last Updated" date at the bottom of this page indicates when these Terms were last revised.</p>
        </div>
      </div>
    `
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-orange-300 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-amber-400 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="inline-flex items-center px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold mb-6 tracking-wide">
            <FileText className="w-4 h-4 mr-2" />
            LEGAL DOCUMENTS
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 tracking-tight">
            Terms of Use
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Please read these terms carefully before using MyQuoteMate
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Last Updated: 15 March 2024</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className={`bg-white border border-gray-200 rounded-2xl p-6 sticky top-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`} style={{ transitionDelay: '200ms' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Quick Navigation</h3>
                    <p className="text-sm text-gray-600">Jump to section</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {termsSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${activeSection === section.id
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeSection === section.id
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {section.icon}
                      </div>
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link
                    to="/privacy"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Privacy Policy</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className={`bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`} style={{ transitionDelay: '300ms' }}>
                {/* Last Updated Banner */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      MyQuoteMate Terms of Use
                    </h2>
                    <p className="text-gray-600 mt-2">These terms govern your use of our quote analysis services</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-sm text-gray-500">Version</div>
                    <div className="font-semibold text-gray-900">2.1.0</div>
                  </div>
                </div>

                {/* Terms Content */}
                <div className="prose prose-lg max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: termsContent[activeSection]
                    }}
                    className="text-gray-700 leading-relaxed"
                  />
                </div>

                {/* Navigation at Bottom */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Link
                      to="/check-quote"
                      className="group flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back to Home
                    </Link>
                    <button
                      onClick={() => {
                        const currentIndex = termsSections.findIndex(s => s.id === activeSection);
                        const nextSection = termsSections[currentIndex + 1];
                        if (nextSection) {
                          setActiveSection(nextSection.id);
                        }
                      }}
                      className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      Next: {termsSections[(termsSections.findIndex(s => s.id === activeSection) + 1) % termsSections.length]?.title || 'Acceptance'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className={`mt-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`} style={{ transitionDelay: '400ms' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Important Legal Notice</h3>
                    <p className="text-gray-700 mb-3">
                      These Terms of Use are a legal agreement between you and MyQuoteMate Pty Ltd. By using our Service, you acknowledge that you have read, understood, and agree to be bound by these terms.
                    </p>
                    <p className="text-sm text-gray-600">
                      If you have any questions about these Terms, please contact us at legal@myquotemate.com.au
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`inline-flex items-center px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold mb-4 sm:mb-6 tracking-wide transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '500ms' }}>
            QUESTIONS?
          </div>
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 tracking-tight transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '600ms' }}>
            Need Legal Clarification?
          </h2>
          <p className={`text-lg sm:text-xl text-gray-700 mb-8 sm:mb-10 max-w-2xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '700ms' }}>
            Our legal team is here to help you understand our terms and policies.
          </p>

          <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '800ms' }}>
            <Link
              to="/contact"
              className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              <span className="relative z-10">Contact Legal Team</span>
              <ArrowRight className="inline-block w-4 h-4 sm:w-5 sm:h-5 ml-2 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-700 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link
              to="/privacy"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl sm:rounded-2xl font-medium text-base sm:text-lg hover:border-orange-300 hover:text-orange-600 transition-all duration-300 w-full sm:w-auto text-center"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(20px);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Terms;