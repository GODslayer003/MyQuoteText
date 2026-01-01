// ============================================
// src/config/queue.js
// ============================================
const Queue = require('bull');
const Redis = require('ioredis');
const logger = require('../utils/logger');

const ENABLE_QUEUES = process.env.ENABLE_QUEUES === 'true';

// --------------------------------------------
// Redis configuration
// --------------------------------------------
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,

  // 🚫 prevent retry spam
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) return null; // STOP retrying
    return Math.min(times * 200, 1000);
  }
};

// --------------------------------------------
// Placeholders (safe exports)
// --------------------------------------------
let redisClient = null;
let redisSubscriber = null;

let documentProcessingQueue = null;
let aiAnalysisQueue = null;
let emailQueue = null;
let retentionQueue = null;

// --------------------------------------------
// Queue options
// --------------------------------------------
const defaultQueueOptions = {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: Number(process.env.QUEUE_MAX_RETRIES) || 3,
    backoff: {
      type: 'exponential',
      delay: Number(process.env.QUEUE_BACKOFF_DELAY) || 5000
    },
    removeOnComplete: 100,
    removeOnFail: 1000
  }
};

// --------------------------------------------
// Setup queue events
// --------------------------------------------
const setupQueueEvents = (queue, name) => {
  queue.on('completed', (job) => {
    logger.debug(`Queue ${name} - Job ${job.id} completed`);
  });

  queue.on('failed', (job, err) => {
    logger.error(`Queue ${name} - Job ${job?.id} failed`, {
      message: err.message
    });
  });

  queue.on('stalled', (job) => {
    logger.warn(`Queue ${name} - Job ${job.id} stalled`);
  });

  // 🚫 swallow redis errors to avoid spam
  queue.on('error', () => {});
};

// --------------------------------------------
// Initialize queues ONLY if enabled
// --------------------------------------------
if (!ENABLE_QUEUES) {
  logger.warn('⚠️ Queues are DISABLED (ENABLE_QUEUES=false)');
} else {
  logger.info('🔌 Initializing Redis & Bull queues');

  redisClient = new Redis(redisConfig);
  redisSubscriber = new Redis(redisConfig);

  // 🚫 silence ioredis error spam
  redisClient.on('error', () => {});
  redisSubscriber.on('error', () => {});

  documentProcessingQueue = new Queue(
    'document-processing',
    defaultQueueOptions
  );
  aiAnalysisQueue = new Queue('ai-analysis', defaultQueueOptions);
  emailQueue = new Queue('email', defaultQueueOptions);
  retentionQueue = new Queue('retention', defaultQueueOptions);

  setupQueueEvents(documentProcessingQueue, 'document-processing');
  setupQueueEvents(aiAnalysisQueue, 'ai-analysis');
  setupQueueEvents(emailQueue, 'email');
  setupQueueEvents(retentionQueue, 'retention');
}

// --------------------------------------------
// Queue health check
// --------------------------------------------
const checkQueueHealth = async () => {
  if (!ENABLE_QUEUES) {
    return { queues: 'disabled' };
  }

  const queues = [
    { name: 'document-processing', queue: documentProcessingQueue },
    { name: 'ai-analysis', queue: aiAnalysisQueue },
    { name: 'email', queue: emailQueue },
    { name: 'retention', queue: retentionQueue }
  ];

  const health = {};

  for (const { name, queue } of queues) {
    try {
      await queue.isReady();
      health[name] = { status: 'healthy' };
    } catch (err) {
      health[name] = {
        status: 'unhealthy',
        error: err.message
      };
    }
  }

  return health;
};

// --------------------------------------------
// Graceful shutdown
// --------------------------------------------
const shutdownQueues = async () => {
  if (!ENABLE_QUEUES) return;

  logger.info('Shutting down queues...');

  await Promise.all([
    documentProcessingQueue?.close(),
    aiAnalysisQueue?.close(),
    emailQueue?.close(),
    retentionQueue?.close()
  ]);

  await redisClient?.quit();
  await redisSubscriber?.quit();

  logger.info('All queues closed');
};

module.exports = {
  documentProcessingQueue,
  aiAnalysisQueue,
  emailQueue,
  retentionQueue,
  checkQueueHealth,
  shutdownQueues,
  redisClient,
  redisSubscriber
};
