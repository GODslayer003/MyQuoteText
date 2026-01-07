import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  Download,
  Cookie,
  Mail,
  Users,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  Trash2,
  Globe,
  Database,
  Phone,
  Bell,
  Calendar,
  Key,
  Server,
  X,
  Sparkles
} from 'lucide-react';

const Privacy = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const privacySections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 'data-collection',
      title: 'Data We Collect',
      icon: <Database className="w-5 h-5" />
    },
    {
      id: 'data-use',
      title: 'How We Use Data',
      icon: <Eye className="w-5 h-5" />
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: <Lock className="w-5 h-5" />
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      icon: <Clock className="w-5 h-5" />
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      icon: <Download className="w-5 h-5" />
    },
    {
      id: 'cookies',
      title: 'Cookies',
      icon: <Cookie className="w-5 h-5" />
    },
    {
      id: 'children',
      title: "Children's Privacy",
      icon: <Bell className="w-5 h-5" />
    },
    {
      id: 'changes',
      title: 'Policy Changes',
      icon: <FileText className="w-5 h-5" />
    }
  ];

  const privacyContent = {
    introduction: `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-4 rounded-r-lg mb-6">
        <p class="text-gray-700"><strong>Our Commitment:</strong> We are bound by the Australian Privacy Principles (APPs) contained in the Privacy Act 1988 (Cth). We handle all personal information in accordance with these principles.</p>
      </div>
      
      <p class="mb-6 text-gray-600">MyQuoteMate Pty Ltd ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our quote analysis services.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="bg-white border border-gray-200 rounded-lg p-5 hover:border-orange-300 transition-colors">
          <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-3">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <h3 class="font-semibold mb-2 text-gray-900">Scope</h3>
          <p class="text-sm text-gray-600">This policy applies to information we collect through our website, mobile applications, and any related services.</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-5 hover:border-orange-300 transition-colors">
          <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <h3 class="font-semibold mb-2 text-gray-900">Consent</h3>
          <p class="text-sm text-gray-600">By using our services, you consent to the collection and use of information as described in this policy.</p>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
        <h3 class="font-semibold mb-3 text-gray-900">Key Definitions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-1">
            <p class="font-medium text-gray-900 text-sm">Personal Information</p>
            <p class="text-xs text-gray-600">Information that identifies you as an individual</p>
          </div>
          <div class="space-y-1">
            <p class="font-medium text-gray-900 text-sm">Quote Data</p>
            <p class="text-xs text-gray-600">Tradie quotes you submit for analysis</p>
          </div>
          <div class="space-y-1">
            <p class="font-medium text-gray-900 text-sm">Service Data</p>
            <p class="text-xs text-gray-600">Information about how you use our services</p>
          </div>
        </div>
      </div>
    `,
    'data-collection': `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-8">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-1">We only collect information necessary to provide our services.</h3>
            <p class="text-gray-600">We minimize data collection and never collect more than we need.</p>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Personal Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span class="text-sm text-gray-700">Name and contact details</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span class="text-sm text-gray-700">Email address</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span class="text-sm text-gray-700">Billing information</span>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span class="text-sm text-gray-700">Account preferences</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span class="text-sm text-gray-700">Communication preferences</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span class="text-sm text-gray-700">Support queries</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
          <h3 class="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Quote Data
          </h3>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Upload className="w-3 h-3 text-orange-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900 mb-1">Uploaded Quotes</p>
                <p class="text-sm text-gray-600">Tradie quotes you upload or paste for analysis. This data is encrypted and automatically deleted after 90 days.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Eye className="w-3 h-3 text-orange-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900 mb-1">Analysis Results</p>
                <p class="text-sm text-gray-600">Our AI's analysis of your quotes, including price comparisons and red flag identification.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    'data-use': `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-4 rounded-r-lg mb-8">
        <div class="flex items-start gap-3">
          <Shield className="w-6 h-6 text-orange-500 flex-shrink-0" />
          <div>
            <p class="font-medium text-gray-900 mb-1">Transparency Promise</p>
            <p class="text-gray-700">We only use your data to provide and improve our services. We never sell your personal information.</p>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white border border-gray-200 rounded-xl p-5 text-center hover:border-orange-300 transition-colors">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <h3 class="font-semibold mb-3 text-gray-900">Service Provision</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Provide quote analysis</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Process payments</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Send notifications</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white border border-gray-200 rounded-xl p-5 text-center hover:border-orange-300 transition-colors">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 class="font-semibold mb-3 text-gray-900">Service Improvement</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Improve AI algorithms</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Update market rates</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Enhance experience</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white border border-gray-200 rounded-xl p-5 text-center hover:border-orange-300 transition-colors">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h3 class="font-semibold mb-3 text-gray-900">Communication</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Service updates</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Educational content</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span class="text-sm text-gray-600">Security notices</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span class="font-medium text-gray-900">You can opt-out of marketing communications at any time.</span>
        </div>
        <p class="text-sm text-gray-600">Use the unsubscribe link in our emails or contact us directly.</p>
      </div>
    `,
    'data-sharing': `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-4 rounded-r-lg mb-8">
        <div class="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0" />
          <div>
            <p class="font-medium text-gray-900 mb-1">Limited Sharing</p>
            <p class="text-gray-700">We only share your information when necessary and with appropriate safeguards.</p>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="font-semibold mb-4 text-gray-900">Service Providers</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span class="text-orange-600 font-bold">$</span>
                </div>
                <div>
                  <p class="font-medium text-gray-900">Payment Processors</p>
                  <p class="text-xs text-gray-600">Stripe, PayPal (payment data only)</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Server className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Cloud Infrastructure</p>
                  <p class="text-xs text-gray-600">AWS, Google Cloud (encrypted data)</p>
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Email Services</p>
                  <p class="text-xs text-gray-600">SendGrid (email delivery)</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Analytics</p>
                  <p class="text-xs text-gray-600">Google Analytics (anonymized data)</p>
                </div>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-4">All service providers are bound by strict confidentiality agreements.</p>
        </div>
        
        <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
          <h3 class="font-semibold mb-3 text-gray-900">What We Never Do</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span class="text-sm text-gray-600">Sell personal information</span>
            </div>
            <div class="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span class="text-sm text-gray-600">Share quote data with advertisers</span>
            </div>
            <div class="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span class="text-sm text-gray-600">Use data without consent</span>
            </div>
            <div class="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span class="text-sm text-gray-600">Disclose identifiable quote data</span>
            </div>
          </div>
        </div>
      </div>
    `,
    'data-security': `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-8">
        <div class="flex items-center gap-4">
          <Lock className="w-8 h-8 text-orange-500" />
          <div>
            <h3 class="font-semibold text-gray-900">Bank-Level Security</h3>
            <p class="text-sm text-gray-600">We implement enterprise-grade security measures to protect your data.</p>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-white" />
          </div>
          <h3 class="font-semibold mb-3 text-gray-900">Technical Measures</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600">256-bit SSL encryption</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600">AES-256 encryption at rest</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600">Regular security audits</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600">Secure data centers</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 class="font-semibold mb-3 text-gray-900">Organizational Measures</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600">Strict access controls</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600">Employee security training</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600">Data breach response plan</span>
            </div>
            <div class="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600">Privacy by design</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
        <h3 class="font-semibold mb-3 text-gray-900">Your Role in Security</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span class="text-sm text-gray-600">Keep password secure</span>
          </div>
          <div class="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span class="text-sm text-gray-600">Don't share login credentials</span>
          </div>
          <div class="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span class="text-sm text-gray-600">Log out of shared devices</span>
          </div>
          <div class="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span class="text-sm text-gray-600">Use strong passwords</span>
          </div>
        </div>
      </div>
    `,
    'data-retention': `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-8">
        <div class="flex items-center gap-4">
          <Trash2 className="w-8 h-8 text-orange-500" />
          <div>
            <h3 class="font-semibold text-gray-900">Minimal Retention Policy</h3>
            <p class="text-sm text-gray-600">We only keep data as long as necessary, then securely delete it.</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div class="grid grid-cols-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold">
          <div class="p-3 text-center">Data Type</div>
          <div class="p-3 text-center">Retention Period</div>
          <div class="p-3 text-center">Reason</div>
        </div>
        <div class="divide-y divide-gray-100">
          <div class="grid grid-cols-3 hover:bg-orange-50 transition-colors">
            <div class="p-3 text-center font-medium text-gray-900">Quote Content</div>
            <div class="p-3 text-center text-orange-600 font-semibold">90 days</div>
            <div class="p-3 text-center text-sm text-gray-600">Automatically deleted after analysis</div>
          </div>
          <div class="grid grid-cols-3 hover:bg-orange-50 transition-colors">
            <div class="p-3 text-center font-medium text-gray-900">Account Information</div>
            <div class="p-3 text-center text-orange-600 font-semibold">7 years</div>
            <div class="p-3 text-center text-sm text-gray-600">Legal and tax compliance</div>
          </div>
          <div class="grid grid-cols-3 hover:bg-orange-50 transition-colors">
            <div class="p-3 text-center font-medium text-gray-900">Payment Records</div>
            <div class="p-3 text-center text-orange-600 font-semibold">7 years</div>
            <div class="p-3 text-center text-sm text-gray-600">Australian tax law</div>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
        <h3 class="font-semibold mb-3 text-gray-900">Data Deletion Options</h3>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900">Account Deletion</p>
              <p class="text-sm text-gray-600">Removes all personal data from our systems</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p class="font-medium text-gray-900">Individual Quote Deletion</p>
              <p class="text-sm text-gray-600">Delete specific quotes upon request</p>
            </div>
          </div>
        </div>
      </div>
    `,
    'your-rights': `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-8">
        <div class="flex items-center gap-4">
          <Download className="w-8 h-8 text-orange-500" />
          <div>
            <h3 class="font-semibold text-gray-900">Your Data, Your Rights</h3>
            <p class="text-sm text-gray-600">Australian privacy law gives you rights over your personal information.</p>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <h3 class="font-semibold mb-3 text-gray-900">Access Rights</h3>
          <p class="text-gray-600 mb-3">Request a copy of the personal information we hold about you.</p>
          <div class="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm">
            Response within 30 days
          </div>
        </div>
        
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <h3 class="font-semibold mb-3 text-gray-900">Deletion Rights</h3>
          <p class="text-gray-600 mb-3">Request erasure of your personal information in certain circumstances.</p>
          <div class="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm">
            Automatic quote deletion: 90 days
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
        <h3 class="font-semibold mb-3 text-gray-900">How to Exercise Your Rights</h3>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
            <span class="text-gray-600">Contact us at privacy@myquotemate.com.au</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
            <span class="text-gray-600">Provide sufficient identification</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
            <span class="text-gray-600">Specify which right you wish to exercise</span>
          </div>
        </div>
      </div>
    `,
    cookies: `
      <div class="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <div class="flex items-center gap-4 mb-6">
          <Cookie className="w-8 h-8 text-orange-500" />
          <div>
            <h3 class="font-semibold text-gray-900">Cookie Policy</h3>
            <p class="text-sm text-gray-600">We use cookies to enhance your experience and analyze service usage.</p>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gradient-to-r from-orange-50 to-amber-50">
                <th class="py-3 px-4 text-left text-gray-900">Cookie Type</th>
                <th class="py-3 px-4 text-left text-gray-900">Purpose</th>
                <th class="py-3 px-4 text-left text-gray-900">Duration</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr class="hover:bg-orange-50">
                <td class="py-3 px-4 font-medium text-gray-900">Essential Cookies</td>
                <td class="py-3 px-4 text-sm text-gray-600">Required for basic functionality</td>
                <td class="py-3 px-4 text-orange-600 font-medium">Session</td>
              </tr>
              <tr class="hover:bg-orange-50">
                <td class="py-3 px-4 font-medium text-gray-900">Analytics Cookies</td>
                <td class="py-3 px-4 text-sm text-gray-600">Help us improve our service</td>
                <td class="py-3 px-4 text-orange-600 font-medium">2 years</td>
              </tr>
              <tr class="hover:bg-orange-50">
                <td class="py-3 px-4 font-medium text-gray-900">Preference Cookies</td>
                <td class="py-3 px-4 text-sm text-gray-600">Remember your settings</td>
                <td class="py-3 px-4 text-orange-600 font-medium">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
        <h3 class="font-semibold mb-3 text-gray-900">Managing Cookies</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600 mb-2">Browser Settings:</p>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Disable cookies entirely</li>
              <li>• Delete existing cookies</li>
              <li>• Set site preferences</li>
              <li>• Use private browsing</li>
            </ul>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-2">Cookie Consent:</p>
            <p class="text-sm text-gray-600">We obtain consent for non-essential cookies via our cookie banner when you first visit our site.</p>
          </div>
        </div>
      </div>
    `,
    children: `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-8">
        <div class="flex items-center gap-4">
          <Bell className="w-8 h-8 text-orange-500" />
          <div>
            <h3 class="font-semibold text-gray-900">Age Restriction</h3>
            <p class="text-sm text-gray-600">Our service is not intended for children under 18.</p>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="font-semibold mb-3 text-gray-900">9.1 Age Requirement</h3>
          <p class="text-gray-600">Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18.</p>
        </div>
        
        <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
          <h3 class="font-semibold mb-3 text-gray-900">9.2 Parental Responsibility</h3>
          <div class="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
            <p class="text-gray-600">If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. We will take steps to remove such information from our servers.</p>
          </div>
        </div>
      </div>
    `,
    changes: `
      <div class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 mb-8">
        <div class="flex items-center gap-4">
          <FileText className="w-8 h-8 text-orange-500" />
          <div>
            <h3 class="font-semibold text-gray-900">We May Update This Policy</h3>
            <p class="text-sm text-gray-600">We will notify you of significant changes to our privacy practices.</p>
          </div>
        </div>
      </div>
      
      <div class="space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="font-semibold mb-3 text-gray-900">Update Process</h3>
          <p class="text-gray-600 mb-4">We reserve the right to update this Privacy Policy at any time. When we do, we will:</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span class="text-orange-600 font-medium">@</span>
              </div>
              <span class="text-sm text-gray-600">Email registered users</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-orange-600" />
              </div>
              <span class="text-sm text-gray-600">In-Service notifications</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <span class="text-sm text-gray-600">Update "Last Updated" date</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-orange-600" />
              </div>
              <span class="text-sm text-gray-600">Post on website</span>
            </div>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-300 rounded-xl p-5">
          <h3 class="font-semibold mb-3 text-gray-900">Your Acceptance</h3>
          <p class="text-gray-600 mb-3">Your continued use of our Service after any modification to this Privacy Policy constitutes your acceptance of such changes.</p>
          <div class="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span class="text-sm text-gray-600">If you do not agree to the changes, you should discontinue using our Service.</span>
          </div>
        </div>
      </div>
    `
  };

  const Upload = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-orange-300 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] sm:w-[500px] sm:h[500px] bg-amber-400 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold mb-6 tracking-wide">
            <Shield className="w-4 h-4 mr-2" />
            YOUR PRIVACY MATTERS
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto">
            How we protect and handle your personal information at MyQuoteMate
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-700">Last Updated: 15 March 2024</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className={`bg-white border border-gray-200 rounded-2xl p-6 sticky top-6 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`} style={{ transitionDelay: '200ms' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Quick Navigation</h3>
                    <p className="text-sm text-gray-600">Jump to section</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {privacySections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-600'
                          : 'text-gray-600 hover:bg-orange-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {section.icon}
                      </div>
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link
                    to="/terms"
                    className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Terms of Use</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-orange-400 group-hover:text-orange-600" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className={`bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`} style={{ transitionDelay: '300ms' }}>
                {/* Last Updated Banner */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      MyQuoteMate Privacy Policy
                    </h2>
                    <p className="text-gray-600 mt-2">Transparent about how we handle your information</p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
                      <span className="text-sm text-orange-600">Version</span>
                      <span className="font-bold text-orange-700">3.2.0</span>
                    </div>
                  </div>
                </div>

                {/* Section Header */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg mb-4">
                    {privacySections.find(s => s.id === activeSection)?.icon}
                    <span className="font-semibold">
                      {privacySections.find(s => s.id === activeSection)?.title}
                    </span>
                  </div>
                </div>

                {/* Privacy Content */}
                <div className="prose prose-lg max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: privacyContent[activeSection] 
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
                        const currentIndex = privacySections.findIndex(s => s.id === activeSection);
                        const nextSection = privacySections[currentIndex + 1];
                        if (nextSection) {
                          setActiveSection(nextSection.id);
                        }
                      }}
                      className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                    >
                      Next: {privacySections[(privacySections.findIndex(s => s.id === activeSection) + 1) % privacySections.length]?.title || 'Introduction'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className={`mt-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`} style={{ transitionDelay: '400ms' }}>
                <h3 className="font-bold text-gray-900 mb-4">Contact Our Privacy Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Privacy Officer</h4>
                    <p className="text-gray-600">Sarah Johnson</p>
                    <p className="text-sm text-orange-600">privacy@myquotemate.com.au</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Postal Address</h4>
                    <p className="text-gray-600">MyQuoteMate Pty Ltd</p>
                    <p className="text-sm text-gray-600">Level 10, 123 Collins St, Melbourne VIC 3000</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  We respond to all privacy inquiries within 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Protection Summary */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`} style={{ transitionDelay: '500ms' }}>
            <div className="inline-flex items-center px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold mb-4 tracking-wide">
              DATA PROTECTION SUMMARY
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
              Key Privacy Points
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Trash2 className="w-6 h-6" />,
                title: "Auto-Deletion",
                description: "Quotes automatically deleted after 90 days"
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: "Bank-Level Encryption",
                description: "All data encrypted at rest and in transit"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "No Data Selling",
                description: "We never sell your personal information"
              },
              {
                icon: <Download className="w-6 h-6" />,
                title: "Your Control",
                description: "Access, correct, or delete your data anytime"
              }
            ].map((point, index) => (
              <div
                key={index}
                className={`bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-orange-300 hover:shadow-lg transition-all duration-300 group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${600 + index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <div className="text-white">
                    {point.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{point.title}</h3>
                <p className="text-sm text-gray-600">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Animations */}
      <style jsx>{`
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

export default Privacy;