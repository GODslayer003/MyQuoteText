// client/src/pages/CheckQuote.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Star,
  AlertTriangle,
  ExternalLink,
  BarChart,
  RefreshCw,
  Copy,
  ArrowLeft,
  X,
  Clock,
  Trash2,
  FileIcon,
  CheckCircle2,
  Brain,
  Shield,
  Loader2,
  ChevronRight,
  Upload,
  FileText,
  Sparkles,
  History,
  Eye,
  Download,
  FileUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { toast } from 'react-hot-toast';
import quoteApi from '../services/quoteApi';
import jobPollingService from '../services/jobPollingService';
import AnalysisResults from '../components/AnalysisResults';

const CheckQuote = () => {
  const { user, isAuthenticated, requestLogin } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'text'
  const [file, setFile] = useState(null);
  const [quoteText, setQuoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [phase, setPhase] = useState('upload'); // 'upload', 'processing', 'result'
  const [chatHistory, setChatHistory] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobResult, setJobResult] = useState(null);
  const [limitError, setLimitError] = useState(null);

  const fileInputRef = useRef(null);

  // Initialize component
  useEffect(() => {
    setIsVisible(true);
    loadUserJobs();
  }, []);

  // Usage Limit Notifications
  useEffect(() => {
    if (user && !isProcessing && phase === 'upload') {
      const credits = user.subscription?.credits || 0;
      const lastFree = user.subscription?.freeReportDate ? new Date(user.subscription.freeReportDate) : null;
      const now = new Date();

      const isFreeUsed = lastFree &&
        lastFree.getMonth() === now.getMonth() &&
        lastFree.getFullYear() === now.getFullYear();

      // Clear existing toasts to prevent duplicates
      toast.dismiss('limit-status');

      if (credits === 0 && isFreeUsed) {
        // Limit Reached
        toast((t) => (
          <div className="flex items-start gap-4 min-w-[300px]">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Monthly Limit Reached</h3>
              <p className="text-sm text-gray-600 mt-1">
                You've used your free report for this month.
                <span className="block mt-1 text-orange-600 font-medium">Upgrade to continue analyzing!</span>
              </p>
            </div>
          </div>
        ), {
          id: 'limit-status',
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#fff',
            border: '1px solid #fed7aa', // orange-200
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }
        });
      } else if (credits === 0 && !isFreeUsed) {
        // Free Report Available
        toast((t) => (
          <div className="flex items-start gap-4 min-w-[300px]">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Free Report Available</h3>
              <p className="text-sm text-gray-600 mt-1">
                You have 1 free analysis available this month. use it wisely!
              </p>
            </div>
          </div>
        ), {
          id: 'limit-status',
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#fff',
            border: '1px solid #bbf7d0', // green-200
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }
        });
      }
    }
  }, [user, isProcessing, phase]);

  // Scroll to bottom
  useEffect(() => {
    if (phase === 'result') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [phase]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      jobPollingService.stopAllPolls();
    };
  }, []);

  // Load user's job history
  const loadUserJobs = async () => {
    if (!isAuthenticated) {
      // Show sample history for non-authenticated users
      return;
    }

    try {
      const jobs = await quoteApi.getUserJobs();
      const history = jobs.map(job => ({
        id: job.jobId,
        name: job.metadata?.title || `Quote Analysis ${new Date(job.createdAt).toLocaleDateString()}`,
        date: formatRelativeTime(job.createdAt),
        quote: job.documents?.[0]?.originalFilename || 'Quote analysis',
        status: job.status,
        jobData: job
      }));
      setChatHistory(history);
    } catch (err) {
      console.error('Failed to load user jobs:', err);
      setError('Failed to load your analysis history');
    }
  };


  const handleSignIn = () => {
    requestLogin('/check-quote');
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const validateFile = (selectedFile) => {
    const validTypes = ['application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      throw new Error('Please upload a PDF file only. We currently support PDF format for analysis.');
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB.');
    }

    return true;
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      validateFile(selectedFile);
      setFile(selectedFile);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeFile = () => {
    setFile(null);
    setExtractedText('');
    setQuoteText('');
    setError(null);
  };

  const validateForm = () => {
    if (!quoteText.trim() && !file) {
      setError('Please upload a PDF file or enter quote text to analyze.');
      return false;
    }

    if (uploadMethod === 'text' && quoteText.trim().length < 50) {
      setError('Please enter at least 50 characters of quote text for accurate analysis.');
      return false;
    }

    return true;
  };

  const handleAnalyzeQuote = async () => {
    if (!isAuthenticated) return handleSignIn();
    if (!validateForm()) return;

    setError(null);
    setSuccess(null);
    setIsAnalyzing(true);

    try {
      let jobData;

      if (uploadMethod === 'file' && file) {
        // Upload PDF file
        jobData = await quoteApi.createJob({
          email: user?.email,
          file,
          tier: user?.subscription?.plan?.toLowerCase() || 'free',
          metadata: {
            source: 'web_upload',
            title: file.name.replace('.pdf', ''),
            method: 'file_upload'
          }
        });
      } else if (uploadMethod === 'text' && quoteText.trim()) {
        // For text input, we need to create a text file
        const textBlob = new Blob([quoteText], { type: 'text/plain' });
        const textFile = new File([textBlob], 'quote-text.txt', { type: 'text/plain' });

        jobData = await quoteApi.createJob({
          email: user?.email,
          file: textFile,
          tier: user?.subscription?.plan?.toLowerCase() || 'free',
          metadata: {
            source: 'web_upload',
            title: 'Text Quote Analysis',
            method: 'text_input',
            textLength: quoteText.length
          }
        });
      }

      if (jobData) {
        setCurrentJob(jobData);
        setPhase('processing');

        // Start polling for job status
        jobPollingService.startPolling(
          jobData.jobId,
          (status) => {
            setJobStatus(status);
            console.log('Job status update:', status);
          },
          async (result) => {
            setJobResult(result);
            setSuccess('Analysis completed successfully!');
            setPhase('result');
            setIsAnalyzing(false);
          },
          (error) => {
            setError(`Analysis failed: ${error.message}`);
            setPhase('upload');
            setIsAnalyzing(false);
          }
        );

        // Add to history
        const newHistoryItem = {
          id: jobData.jobId,
          name: file ? file.name.replace('.pdf', '') : 'Text Quote Analysis',
          date: 'Just now',
          quote: quoteText.substring(0, 50) + '...',
          status: 'processing',
          jobData
        };
        setChatHistory(prev => [newHistoryItem, ...prev]);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      // Check for limit reached error
      if (err.response?.status === 403 && (err.response?.data?.nextAvailableDate || err.message.includes('limit'))) {
        const nextDateStr = err.response?.data?.nextAvailableDate;
        const nextDate = nextDateStr ? new Date(nextDateStr) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        setLimitError({
          title: "Monthly Free Limit Reached",
          message: "You've used your free quote analysis for this month.",
          nextDate: nextDate
        });
        setError(null);
      } else {
        setError(err.message || 'Failed to analyze quote. Please try again.');
        setLimitError(null);
      }
      setIsAnalyzing(false);
    }
  };

  const resetToUpload = () => {
    setPhase('upload');
    setFile(null);
    setQuoteText('');
    setExtractedText('');
    setCurrentJob(null);
    setJobStatus(null);
    setJobResult(null);
    setError(null);
    setLimitError(null);
    setSuccess(null);

    // Stop any polling
    if (currentJob?.jobId) {
      jobPollingService.stopPolling(currentJob.jobId);
    }
  };

  const loadHistoryItem = async (item) => {
    if (!item.jobData) {
      setError('Unable to load this analysis. Please try analyzing it again.');
      return;
    }

    try {
      setPhase('loading');
      setCurrentJob(item.jobData);

      // Load job details
      const job = await quoteApi.getJob(item.jobData.jobId);
      setJobStatus(job);

      if (job.status === 'completed' && job.result) {
        const result = await quoteApi.getJobResult(item.jobData.jobId);
        setJobResult(result);
        setPhase('result');
      } else if (job.status === 'processing') {
        setPhase('processing');
        // Resume polling
        jobPollingService.startPolling(
          item.jobData.jobId,
          (status) => setJobStatus(status),
          async (result) => {
            setJobResult(result);
            setPhase('result');
          },
          (error) => setError(`Analysis failed: ${error.message}`)
        );
      } else {
        setPhase('result');
        // Show error or message
        if (job.status === 'failed') {
          setError('This analysis failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to load history item:', err);
      setError('Failed to load this analysis. Please try again.');
      setPhase('upload');
    }
  };

  const sampleQuotes = [
    {
      name: "Plumbing Quote",
      text: `PLUMBING QUOTE - BATHROOM RENOVATION

Client: Jane Smith
Date: 15/03/2024
Quote #: PL-2024-0315

SCOPE OF WORK:
- Remove existing bath, toilet, and vanity
- Install new freestanding bath
- Install new wall-mounted toilet
- Install new double vanity with stone top
- Install mixer tap and shower head
- Install new waste and water connections
- Test all fixtures and ensure no leaks

MATERIALS INCLUDED:
- Caroma Solus wall face toilet suite
- Caroma Liano 1700mm freestanding bath
- Custom 1500mm double vanity with stone top
- Astra Walker Icon mixer set
- All necessary plumbing fittings and fixtures

LABOUR: 3 days @ $95/hour = $2,280
MATERIALS: $4,500
GST (10%): $678
TOTAL: $7,458

WARRANTY: 5 years on workmanship, 1 year on fixtures
TIMELINE: Start within 2 weeks of acceptance
PAYMENT: 20% deposit, balance on completion`
    },
    {
      name: "Electrical Quote",
      text: `ELECTRICAL REWIRING QUOTE

PROPERTY: 3 bedroom house, single storey
CLIENT: John & Sarah Wilson
DATE: 20/03/2024

WORK INCLUDED:
- Complete rewire of existing house
- New switchboard with safety switches
- 30 power points (double GPOs)
- 20 LED downlights throughout
- 2 ceiling fans with remote control
- External security lighting x 4
- Data points in living and bedrooms
- Smoke alarms in all bedrooms and hallways

BREAKDOWN:
Labour (5 days @ $110/hr): $4,400
Materials (wires, switches, fixtures): $3,800
Switchboard upgrade: $1,200
Safety certification: $250
GST (10%): $965
TOTAL: $10,615

NOT INCLUDED:
- Plaster repair after chasing
- Painting
- Any structural modifications

LICENSE: QLD Electrical License #123456
INSURANCE: $20M Public Liability
WARRANTY: 6 years on workmanship`
    }
  ];

  const insertSampleQuote = (text) => {
    setQuoteText(text);
    setUploadMethod('text');
  };

  // Processing status component
  const renderProcessingStatus = () => {
    if (!jobStatus) return null;

    const steps = jobStatus.processingSteps || [];
    const currentStep = steps.find(step => step.status === 'in_progress') || steps[steps.length - 1];

    return (
      <div className="space-y-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Quote</h3>
          <p className="text-gray-600">This usually takes 30-60 seconds</p>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : step.status === 'in_progress' ? (
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                ) : step.status === 'failed' ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                )}
                <div>
                  <p className="font-medium text-gray-900 capitalize">{step.step.replace('_', ' ')}</p>
                  {step.message && (
                    <p className="text-sm text-gray-600">{step.message}</p>
                  )}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${step.status === 'completed' ? 'bg-green-100 text-green-800' :
                step.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                  step.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                {step.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Job ID: {currentJob?.jobId?.substring(0, 8)}...
          </p>
        </div>
      </div>
    );
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
            <Brain className="w-4 h-4 mr-2" />
            AI-POWERED QUOTE ANALYSIS
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 tracking-tight">
            Smart Quote Analysis
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Upload your tradie quote and get instant AI analysis on pricing, fairness, and what to ask
          </p>

          {!isAuthenticated && (
            <div className="mt-6">
              <button
                onClick={handleSignIn}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Sign In to Get Started
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Free analysis for first-time users
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Error/Success Messages */}
      {(error || success || limitError) && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          {limitError && (
            <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{limitError.title}</h3>
                  <p className="text-gray-700 mb-3">
                    {limitError.message} Next free analysis available on: <span className="font-semibold">{limitError.nextDate.toLocaleDateString()}</span>
                  </p>
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                  >
                    Upgrade for Unlimited Access
                  </button>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Success</p>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Box */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Chat History (Order 2 on mobile, 1 on desktop) */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className={`bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`} style={{ transitionDelay: '200ms' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Analysis History</h3>
                    <p className="text-sm text-gray-600">Your recent quote checks</p>
                  </div>
                </div>

                <div className="h-[400px] flex flex-col relative">
                  {!isAuthenticated && (
                    <div className="absolute inset-x-[-8px] inset-y-[-8px] z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                        <Shield className="w-6 h-6 text-orange-600" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">History Locked</h4>
                      <p className="text-xs text-gray-600 mb-4">Sign in to save and view your analysis history</p>
                      <button
                        onClick={handleSignIn}
                        className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                      >
                        Sign In / Sign Up
                      </button>
                    </div>
                  )}

                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search history..."
                        className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Scrollable History Items */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="space-y-3">
                      {chatHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No analysis history yet</p>
                        </div>
                      ) : (
                        chatHistory.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => loadHistoryItem(item)}
                            className="w-full text-left p-3 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl transition-all duration-200 group hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 group-hover:text-orange-600 truncate">
                                    {item.name}
                                  </span>
                                  {item.status === 'processing' && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Processing
                                    </span>
                                  )}
                                  {item.status === 'completed' && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                      <Star className="w-3 h-3 mr-1" />
                                      Completed
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{item.quote}</p>
                              </div>
                              <Clock className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                                  {item.date}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* History Stats */}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{chatHistory.length} analyses</span>
                      {isAuthenticated && chatHistory.length > 0 && (
                        <button
                          onClick={() => loadUserJobs()}
                          className="text-orange-500 hover:text-orange-600 text-sm flex items-center gap-1"
                          title="Refresh history"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tips Section */}
                <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Tip: Quick Actions</p>
                      <p className="text-xs text-gray-600">
                        Click on any past analysis to review it, or upload a new quote for analysis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Main Box (Order 1 on mobile, 2 on desktop) */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className={`bg-white border border-gray-200 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-700 shadow-lg hover:shadow-xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`} style={{ transitionDelay: '400ms' }}>

                {/* Phase 1: Upload/Text Input */}
                {phase === 'upload' && (
                  <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                          <FileUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Check Your Quote</h2>
                          <p className="text-gray-600">Upload or paste your tradie quote for analysis</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Step 1 of 2</div>
                        {user && (
                          <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                            {user.subscription?.credits > 0 ? (
                              <>
                                <Zap className="w-3 h-3 text-orange-500 mr-1.5" />
                                {user.subscription.credits} Credit{user.subscription.credits !== 1 ? 's' : ''} Remaining
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-blue-500 mr-1.5" />
                                {user.subscription?.freeReportDate &&
                                  new Date(user.subscription.freeReportDate).getMonth() === new Date().getMonth() &&
                                  new Date(user.subscription.freeReportDate).getFullYear() === new Date().getFullYear()
                                  ? 'Monthly Free Report Used'
                                  : 'Free Report Available'}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Method Tabs */}
                    <div className="flex gap-2 mb-8">
                      <button
                        onClick={() => setUploadMethod('file')}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all flex-1 ${uploadMethod === 'file'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Upload className="w-4 h-4" />
                        Upload PDF
                      </button>
                      <button
                        onClick={() => setUploadMethod('text')}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all flex-1 ${uploadMethod === 'text'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <FileText className="w-4 h-4" />
                        Paste Text
                      </button>
                    </div>

                    {/* File Upload Section */}
                    {uploadMethod === 'file' && (
                      <div className="mb-8">
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                          onClick={() => {
                            if (!isAuthenticated) handleSignIn();
                          }}
                        >
                          {file ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between bg-orange-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                  <FileIcon className="w-8 h-8 text-orange-500" />
                                  <div className="text-left">
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-600">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={removeFile}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-5 h-5 text-gray-500 hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-orange-500" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Upload Your Quote PDF
                              </h3>
                              <p className="text-gray-600 mb-4">
                                PDF format only • Max 10MB
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current.click();
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                              >
                                Choose PDF File
                              </button>
                              <p className="text-sm text-gray-500 mt-3">
                                or drag and drop PDF file here
                              </p>
                            </>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* Text Input Section */}
                    {uploadMethod === 'text' && (
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Quote Details</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setQuoteText('')}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Clear text"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => navigator.clipboard.writeText(quoteText)}
                              disabled={!quoteText}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Copy text"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <textarea
                            value={quoteText}
                            onChange={(e) => setQuoteText(e.target.value)}
                            placeholder="Paste your quote details here..."
                            rows="8"
                            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all resize-none font-mono text-sm"
                          />
                        </div>

                        {/* Sample Quotes */}
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">Try a sample quote:</p>
                          <div className="flex flex-wrap gap-2">
                            {sampleQuotes.map((sample, index) => (
                              <button
                                key={index}
                                onClick={() => insertSampleQuote(sample.text)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                              >
                                {sample.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Privacy Notice */}
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl mb-8">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 mb-1">Your Privacy is Protected</p>
                        <p className="text-sm text-gray-600">
                          Your quote is analyzed securely. Files are automatically deleted after 90 days and all data is encrypted in transit and at rest.
                        </p>
                      </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                      onClick={handleAnalyzeQuote}
                      disabled={isAnalyzing || (!quoteText.trim() && !file)}
                      className="group relative w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isAnalyzing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {uploadMethod === 'text' ? 'Analyzing Quote...' : 'Uploading & Analyzing...'}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Brain className="w-5 h-5" />
                          Analyze My Quote
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Phase 2: Processing */}
                {phase === 'processing' && (
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Analyzing Your Quote</h2>
                          <p className="text-gray-600">Our AI is processing your quote</p>
                        </div>
                      </div>
                      <button
                        onClick={resetToUpload}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>

                    {renderProcessingStatus()}

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          This analysis uses {user?.subscription?.plan === 'Standard' ? 'advanced' : 'basic'} AI processing
                        </p>
                        <div className="flex justify-center gap-4 mt-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">1-2</div>
                            <div className="text-xs text-gray-600">Minutes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">AI</div>
                            <div className="text-xs text-gray-600">Analysis</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">100%</div>
                            <div className="text-xs text-gray-600">Secure</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase 3: Results Section */}
                {phase === 'result' && (
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                          <BarChart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                          <p className="text-gray-600">Review your quote insights below</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={resetToUpload}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back to Upload
                        </button>
                      </div>
                    </div>

                    {jobResult && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <AnalysisResults
                          jobResult={jobResult}
                          userTier={user?.subscription?.plan?.toLowerCase() || 'free'}
                        />
                      </div>
                    )}

                    {!isAuthenticated && (
                      <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-2xl text-center">
                        <Shield className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Want to save this analysis?</h3>
                        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                          Sign up for a free account to save your analysis history, download PDF reports, and unlock more features.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          <button
                            onClick={handleSignIn}
                            className="px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                          >
                            Sign Up Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Loading Phase */}
                {phase === 'loading' && (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Analysis</h3>
                      <p className="text-gray-600">Fetching your quote analysis...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tips Below Main Box */}
              <div className={`mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`} style={{ transitionDelay: '600ms' }}>
                {[
                  {
                    icon: <Eye className="w-5 h-5" />,
                    title: "Spot Red Flags",
                    text: "Learn what to look for in dodgy quotes"
                  },
                  {
                    icon: <Download className="w-5 h-5" />,
                    title: "Get PDF Report",
                    text: "Download detailed analysis anytime"
                  },
                  {
                    icon: <Sparkles className="w-5 h-5" />,
                    title: "AI Insights",
                    text: "Get market comparisons instantly"
                  }
                ].map((tip, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <div className="text-orange-500">
                        {tip.icon}
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                    <p className="text-sm text-gray-600">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Animations */}

    </div>
  );
};

export default CheckQuote;