require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const { connectDB, disconnectDB } = require('./db/connection');
const { shutdownQueues } = require('./config/queue');
const routes = require('./api/routes');
const errorMiddleware = require('./api/middleware/error.middleware');

const rateLimitMiddleware = require('./api/middleware/rateLimit.middleware');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Trust proxy (required for rate limiting behind reverse proxy/load balancer)
app.set('trust proxy', 1);

// ============================================
// REQUEST PARSING MIDDLEWARE
// ============================================

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// ============================================
// COMPRESSION & OPTIMIZATION
// ============================================

// Gzip compression
app.use(compression());

// ============================================
// SECURITY - NoSQL INJECTION PROTECTION
// ============================================

// Sanitize data against NoSQL injection attacks
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Potential NoSQL injection attempt detected: ${key}`, {
      ip: req.ip,
      path: req.path
    });
  }
}));

// ============================================
// LOGGING
// ============================================

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// ============================================
// RATE LIMITING
// ============================================

// Apply global rate limiter
app.use(rateLimitMiddleware.globalLimiter);

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  });
});

// Detailed health check (includes DB and queue status)
app.get('/health/detailed', async (req, res) => {
  try {
    const { checkConnection } = require('./db/connection');
    const { checkQueueHealth } = require('./config/queue');

    const [dbHealthy, queueHealth] = await Promise.all([
      checkConnection().catch(() => false),
      checkQueueHealth().catch(() => ({ status: 'error' }))
    ]);

    const overallStatus = dbHealthy && 
      Object.values(queueHealth).every(q => q.status === 'healthy');

    res.status(overallStatus ? 200 : 503).json({
      status: overallStatus ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'healthy',
          uptime: Math.floor(process.uptime())
        },
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          type: 'MongoDB'
        },
        queues: queueHealth,
        redis: {
          status: Object.keys(queueHealth).length > 0 ? 'healthy' : 'unhealthy'
        }
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// API ROUTES
// ============================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MyQuoteMate API',
    version: process.env.API_VERSION || 'v1',
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    documentation: `${process.env.API_BASE_URL || 'http://localhost:3000'}/docs`,
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      api: `/api/${process.env.API_VERSION || 'v1'}`
    }
  });
});

// Mount API routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must be after all routes
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler - must be last
app.use(errorMiddleware.handler.bind(errorMiddleware));


// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed - no longer accepting connections');

    try {
      // Close database connection
      logger.info('Closing MongoDB connection...');
      await disconnectDB();
      logger.info('MongoDB connection closed successfully');

      // Close queue connections
      logger.info('Closing job queue connections...');
      await shutdownQueues();
      logger.info('Job queues closed successfully');

      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, 30000);
};

// ============================================
// PROCESS EVENT HANDLERS
// ============================================

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise
  });
  
  // In production, you might want to exit on unhandled rejections
  if (process.env.NODE_ENV === 'production') {
    logger.error('Unhandled rejection in production - initiating shutdown');
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  });
  
  // Uncaught exceptions are serious - always exit
  logger.error('Uncaught exception detected - initiating emergency shutdown');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 3000;
let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.info('MongoDB connected successfully');

    // Start Express server
    server = app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 MyQuoteMate Backend Server Started Successfully          ║
║                                                               ║
║   Environment:  ${(process.env.NODE_ENV || 'development').padEnd(44)}║
║   Port:         ${String(PORT).padEnd(44)}║
║   API Version:  ${(process.env.API_VERSION || 'v1').padEnd(44)}║
║   Node Version: ${process.version.padEnd(44)}║
║                                                               ║
║   🌐 API URL:    http://localhost:${PORT}${' '.repeat(27)}║
║   📚 API Docs:   http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}${' '.repeat(15)}║
║   ❤️  Health:     http://localhost:${PORT}/health${' '.repeat(20)}║
║                                                               ║
║   Press Ctrl+C to stop${' '.repeat(34)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);

      // Log important configuration
      logger.info('Server configuration:', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        apiVersion: process.env.API_VERSION || 'v1',
        mongoUri: process.env.MONGODB_URI ? '***configured***' : 'NOT SET',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
      });
    });

    // Handle server errors
  

    // Log when server is ready
    server.on('listening', () => {
      const addr = server.address();
      logger.info(`Server is listening on ${addr.address}:${addr.port}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', {
      message: error.message,
      stack: error.stack
    });
    
    // Try to cleanup before exit
    try {
      await disconnectDB();
    } catch (cleanupError) {
      logger.error('Failed to cleanup during startup failure:', cleanupError);
    }
    
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
module.exports = app;