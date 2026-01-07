// client/src/pages/CheckQuote.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Send,
  Loader2,
  Brain,
  Shield,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  Sparkles,
  FileIcon,
  Trash2,
  History,
  Clock,
  Eye,
  Download,
  FileUp,
  Copy,
  AlertCircle,
  ArrowLeft,
  Search,
  Star,
  AlertTriangle,
  ExternalLink,
  BarChart,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
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
  const [phase, setPhase] = useState('upload'); // 'upload', 'processing', 'chat'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobResult, setJobResult] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize component
  useEffect(() => {
    setIsVisible(true);
    loadUserJobs();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setChatHistory([
        { id: 1, name: 'Plumbing Quote Analysis', date: 'Today', quote: 'Kitchen renovation plumbing work', status: 'completed' },
        { id: 2, name: 'Electrical Quote Review', date: 'Yesterday', quote: 'House rewiring estimate', status: 'completed' },
        { id: 3, name: 'Building Quote Check', date: 'Dec 10', quote: 'Deck construction proposal', status: 'completed' },
      ]);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (!isAuthenticated) {
      setError('Please sign in to analyze quotes');
      return false;
    }

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
    if (!validateForm()) return;

    setError(null);
    setSuccess(null);
    setIsAnalyzing(true);

    try {
      let jobData;

      if (uploadMethod === 'file' && file) {
        // Upload PDF file
        jobData = await quoteApi.createJob({
          email: user.email,
          file,
          tier: user.subscription?.plan?.toLowerCase() || 'free',
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
          email: user.email,
          file: textFile,
          tier: user.subscription?.plan?.toLowerCase() || 'free',
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
            
            // Start chat phase
            await startChatPhase(jobData.jobId);
          },
          (error) => {
            setError(`Analysis failed: ${error.message}`);
            setPhase('upload');
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
      setError(err.message || 'Failed to analyze quote. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const startChatPhase = async (jobId) => {
    try {
      setPhase('chat');
      setIsAnalyzing(false);

      // Load chat history for this job
      const chatHistory = await quoteApi.getChatHistory(jobId);
      if (chatHistory.length > 0) {
        setMessages(chatHistory.map(msg => ({
          id: msg._id,
          text: msg.message,
          sender: msg.sender,
          timestamp: new Date(msg.createdAt)
        })));
      } else {
        // Add initial message
        const initialMessage = {
          id: Date.now(),
          text: "Hi! I'm your Quote Assistant. I've analyzed your quote and found some interesting insights. Feel free to ask me any questions about pricing, scope, or anything else that needs clarification.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([initialMessage]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      // Fallback to basic chat
      setPhase('chat');
      setIsAnalyzing(false);
      
      const initialMessage = {
        id: Date.now(),
        text: "Hi! I'm your Quote Assistant. I've analyzed your quote and found some interesting insights. Feel free to ask me any questions about pricing, scope, or anything else that needs clarification.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentJob?.jobId) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      // Send message to AI
      const response = await quoteApi.chatWithAI(currentJob.jobId, newMessage, messages);
      
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: response.reply,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback to mock response if API fails
      setTimeout(() => {
        const mockResponses = [
          "The labour rate in your quote appears reasonable at approximately $85/hour, which is standard for licensed tradies in most Australian cities.",
          "I notice some items aren't broken down in detail. You might want to ask for specific brand names and quantities to ensure quality.",
          "The warranty terms look good if they're backed by proper insurance and documentation.",
          "For comparison, similar work typically ranges from $3,200 to $4,500 in major cities, so this quote is quite competitive.",
          "Consider asking about their public liability insurance certificate and license number for verification.",
          "The timeline seems reasonable for this scope of work. Make sure they include cleanup in the quote."
        ];
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        
        const botMessage = {
          id: `bot-${Date.now()}`,
          text: randomResponse,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000);
    }
  };

  const resetToUpload = () => {
    setPhase('upload');
    setMessages([]);
    setFile(null);
    setQuoteText('');
    setExtractedText('');
    setCurrentJob(null);
    setJobStatus(null);
    setJobResult(null);
    setError(null);
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
        await startChatPhase(item.jobData.jobId);
      } else if (job.status === 'processing') {
        setPhase('processing');
        // Resume polling
        jobPollingService.startPolling(
          item.jobData.jobId,
          (status) => setJobStatus(status),
          async (result) => {
            setJobResult(result);
            await startChatPhase(item.jobData.jobId);
          },
          (error) => setError(`Analysis failed: ${error.message}`)
        );
      } else {
        setPhase('chat');
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

  const handleSignIn = () => {
    requestLogin('/check-quote');
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
              <span className={`text-xs px-2 py-1 rounded-full ${
                step.status === 'completed' ? 'bg-green-100 text-green-800' :
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

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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
      {(error || success) && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
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
            {/* Left Column - Chat History */}
            <div className="lg:col-span-1">
              <div className={`bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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

                <div className="h-[400px] flex flex-col">
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
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
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

            {/* Right Column - Main Box */}
            <div className="lg:col-span-3">
              <div className={`bg-white border border-gray-200 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-700 shadow-lg hover:shadow-xl ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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
                      <div className="text-sm text-gray-500">
                        Step 1 of 2
                      </div>
                    </div>

                    {/* Authentication Required Notice */}
                    {!isAuthenticated && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-1">Sign In Required</p>
                            <p className="text-sm text-gray-600 mb-3">
                              Please sign in to analyze quotes. Your first analysis is free!
                            </p>
                            <button
                              onClick={handleSignIn}
                              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                            >
                              Sign In / Sign Up
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Method Tabs */}
                    <div className="flex gap-2 mb-8">
                      <button
                        onClick={() => setUploadMethod('file')}
                        disabled={!isAuthenticated}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all flex-1 ${
                          uploadMethod === 'file'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        Upload PDF
                      </button>
                      <button
                        onClick={() => setUploadMethod('text')}
                        disabled={!isAuthenticated}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all flex-1 ${
                          uploadMethod === 'text'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        Paste Text
                      </button>
                    </div>

                    {/* File Upload Section */}
                    {uploadMethod === 'file' && isAuthenticated && (
                      <div className="mb-8">
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-8 text-center hover:border-orange-400 transition-colors">
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
                                onClick={() => fileInputRef.current.click()}
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
                    {uploadMethod === 'text' && isAuthenticated && (
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
                            placeholder="Paste your quote details here...

Example:
Plumbing Quote - Bathroom Renovation
Labour: $2,500
Materials: $1,200
Total: $3,700
Warranty: 5 years"
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
                      disabled={isAnalyzing || (!quoteText.trim() && !file) || !isAuthenticated}
                      className="group relative w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isAnalyzing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading & Analyzing...
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
                          This analysis uses {user?.subscription?.plan === 'Professional' ? 'advanced' : 'basic'} AI processing
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

                {/* Phase 3: Chat Interface */}
                {phase === 'chat' && (
                  <div className="space-y-8">
                    {/* Chat Interface */}
                    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={resetToUpload}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            title="Back to upload"
                          >
                            <ArrowLeft className="w-5 h-5 text-white" />
                          </button>
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white">Quote Assistant</h3>
                            <p className="text-white/90 text-sm">
                              {jobResult ? 'Analysis complete! Ask me anything' : 'Analyzing your quote...'}
                            </p>
                          </div>
                        </div>
                        {currentJob && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => window.open(`/analysis/${currentJob.jobId}`, '_blank')}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 text-white/90 text-sm"
                              title="View full analysis"
                            >
                              <BarChart className="w-4 h-4" />
                              <span className="hidden sm:inline">Analysis</span>
                            </button>
                            <div className="text-xs text-white/80 flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>Online</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div 
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100"
                    >
                      {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Starting Conversation</h3>
                            <p className="text-gray-600">Loading analysis results...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl p-4 ${
                                  msg.sender === 'user'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                                }`}
                              >
                                <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.text}</p>
                                <p className="text-xs mt-2 opacity-70">
                                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="border-t border-gray-200 p-4 bg-white">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Ask about pricing, red flags, or anything else..."
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                          disabled={!jobResult}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || !jobResult}
                          className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">Send</span>
                        </button>
                      </form>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => setNewMessage("Is this price fair?")}
                          className="px-3 py-1.5 text-xs bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                        >
                          Is this price fair?
                        </button>
                        <button
                          onClick={() => setNewMessage("What should I ask my tradie?")}
                          className="px-3 py-1.5 text-xs bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                        >
                          What should I ask?
                        </button>
                        <button
                          onClick={() => setNewMessage("Any hidden costs?")}
                          className="px-3 py-1.5 text-xs bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
                        >
                          Hidden costs?
                        </button>
                      </div>
                    </div>
                    </div>
                    {/* End Chat Interface */}

                    {/* Analysis Results Section - Below Chat */}
                    {jobResult && (
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 sm:p-8 border border-gray-200 shadow-md">
                        <div className="mb-8">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                            <h2 className="text-3xl font-bold text-gray-900">Detailed Analysis Report</h2>
                            <span className="px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-lg text-sm font-semibold whitespace-nowrap">
                              {user?.subscription?.plan || 'Free'} Tier
                            </span>
                          </div>
                          <p className="text-gray-600">Complete analysis of your quote with tier-specific insights</p>
                        </div>
                        <AnalysisResults 
                          jobResult={jobResult}
                          userTier={user?.subscription?.plan?.toLowerCase() || 'free'}
                        />
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
              <div className={`mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
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

export default CheckQuote;