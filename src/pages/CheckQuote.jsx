import React, { useState, useRef, useEffect } from 'react';
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
  Star
} from 'lucide-react';

const CheckQuote = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'text'
  const [file, setFile] = useState(null);
  const [quoteText, setQuoteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [phase, setPhase] = useState('upload'); // 'upload' or 'chat'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    // Load sample history
    setChatHistory([
      { id: 1, name: 'Plumbing Quote Analysis', date: 'Today', quote: 'Kitchen renovation plumbing work' },
      { id: 2, name: 'Electrical Quote Review', date: 'Yesterday', quote: 'House rewiring estimate' },
      { id: 3, name: 'Building Quote Check', date: 'Dec 10', quote: 'Deck construction proposal' },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a PDF, JPG, or PNG file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    
    // Simulate text extraction
    setIsProcessing(true);
    setTimeout(() => {
      const mockExtractedText = `Plumbing Quote - Kitchen Renovation

Client: John Smith
Date: 15/03/2024
Quote #: PL-2024-0315

Scope:
- Remove existing sink and tapware
- Install new stainless steel sink
- Install new mixer tap
- Connect waste disposal
- Install water filter system

Labour: $2,500.00
Materials: $1,200.00
Total: $3,700.00

Warranty: 5 years workmanship
Timeline: 1-2 days`;
      
      setExtractedText(mockExtractedText);
      setIsProcessing(false);
      setQuoteText(mockExtractedText);
    }, 1500);
  };

  const removeFile = () => {
    setFile(null);
    setExtractedText('');
    setQuoteText('');
  };

  const handleAnalyzeQuote = () => {
    if (!quoteText.trim() && !file) {
      alert('Please upload a file or enter quote text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    
    setTimeout(() => {
      setIsAnalyzing(false);
      
      // Start chat phase
      setPhase('chat');
      
      // Add initial message from assistant
      const initialMessage = {
        id: 1,
        text: "Hi! I'm your Quote Assistant. I've analyzed your quote and found some interesting points. Feel free to ask me any questions about the pricing, scope, or anything else that needs clarification.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      
      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        name: `Quote Analysis ${new Date().toLocaleDateString()}`,
        date: 'Just now',
        quote: quoteText.substring(0, 50) + '...'
      };
      setChatHistory(prev => [newHistoryItem, ...prev]);
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "The labour rate in your quote appears reasonable at approximately $85/hour, which is standard for licensed plumbers in most Australian cities.",
        "I notice the materials aren't broken down by item. You might want to ask for specific brand names and quantities to ensure quality.",
        "The warranty mentions 5 years workmanship - this is excellent if it's backed by proper insurance and documentation.",
        "For comparison, similar kitchen plumbing work typically ranges from $3,200 to $4,500 in major cities, so $3,700 is quite competitive.",
        "Consider asking about their public liability insurance certificate and plumbing license number for verification.",
        "The timeline of 1-2 days seems reasonable for this scope of work. Make sure they include cleanup in the quote."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage = {
        id: messages.length + 2,
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const resetToUpload = () => {
    setPhase('upload');
    setMessages([]);
    setFile(null);
    setQuoteText('');
    setExtractedText('');
  };

  const loadHistoryItem = (item) => {
    setPhase('chat');
    // In a real app, you would load the actual chat history
    const sampleMessages = [
      {
        id: 1,
        text: "Reviewing your previous quote analysis...",
        sender: 'bot',
        timestamp: new Date()
      },
      {
        id: 2,
        text: "This quote had reasonable pricing but lacked detailed material specifications.",
        sender: 'bot',
        timestamp: new Date()
      }
    ];
    setMessages(sampleMessages);
  };

  const sampleQuotes = [
    {
      name: "Plumbing Quote",
      text: `Plumbing Quote - Bathroom Renovation
Labour: $3,200
Materials: $2,500
Total: $5,700`
    },
    {
      name: "Electrical Quote",
      text: `Electrical Rewiring - 3 Bedroom House
Labour: $4,500
Materials: $3,800
Total: $8,300`
    }
  ];

  const insertSampleQuote = (text) => {
    setQuoteText(text);
    setUploadMethod('text');
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
            CHECK YOUR TRADIE QUOTE
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 tracking-tight">
            Get Instant Quote Analysis
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Upload or paste your quote, then chat with our AI assistant about pricing, fairness, and what to ask your tradie
          </p>
        </div>
      </section>

      {/* Main Content Box */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Chat History */}
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

    {/* Scrollable History Container */}
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
          {chatHistory.map((item) => (
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
                    {item.id === 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                        <Star className="w-3 h-3 mr-1" />
                        Latest
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
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                    Completed
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* History Stats */}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{chatHistory.length} analyses</span>
          <button
            onClick={() => {
              // Clear history functionality
              if (window.confirm('Clear all history?')) {
                setChatHistory([]);
              }
            }}
            className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
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
            Click on any past analysis to review it, or use the search to find specific quotes.
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
                {phase === 'upload' ? (
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

                    {/* Method Tabs */}
                    <div className="flex gap-2 mb-8">
                      <button
                        onClick={() => setUploadMethod('file')}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all flex-1 ${
                          uploadMethod === 'file'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        Upload File
                      </button>
                      <button
                        onClick={() => setUploadMethod('text')}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all flex-1 ${
                          uploadMethod === 'text'
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
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-8 text-center hover:border-orange-400 transition-colors">
                          {file ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between bg-orange-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                  <FileIcon className="w-8 h-8 text-orange-500" />
                                  <div className="text-left">
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-600">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
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
                              
                              {isProcessing && (
                                <div className="flex items-center justify-center gap-3 text-orange-600">
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span>Extracting text from file...</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-orange-500" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Upload Your Quote
                              </h3>
                              <p className="text-gray-600 mb-4">
                                PDF, JPG, or PNG (Max 10MB)
                              </p>
                              <button
                                onClick={() => fileInputRef.current.click()}
                                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                              >
                                Choose File
                              </button>
                              <p className="text-sm text-gray-500 mt-3">
                                or drag and drop files here
                              </p>
                            </>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
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
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                                Plumbing Quote - Kitchen Renovation
                                Labour: $2,500
                                Materials: $1,200
                                Total: $3,700"
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
                          Your quote is analyzed securely using bank-grade encryption. We don't store the content permanently and all data is automatically deleted after 90 days.
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
                          Analyzing Your Quote...
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
                ) : (
                  /* Phase 2: Chat Interface */
                  <div className="flex flex-col h-[600px]">
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
                            <p className="text-white/90 text-sm">Ask me anything about your quote</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/80">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Online • AI-Powered</span>
                        </div>
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
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a Conversation</h3>
                            <p className="text-gray-600">Ask questions about your quote analysis</p>
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
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
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