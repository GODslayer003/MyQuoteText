const mongoose = require('mongoose');
const logger = require('../utils/logger');
const dbConfig = require('../config/database');

class DatabaseConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Prevent multiple connections
      if (this.connection && mongoose.connection.readyState === 1) {
        logger.info('MongoDB already connected');
        return this.connection;
      }

      // Connect to MongoDB
      this.connection = await mongoose.connect(dbConfig.mongodb.uri, dbConfig.mongodb.options);

      logger.info('MongoDB connected successfully', {
        host: mongoose.connection.host,
        db: mongoose.connection.name
      });

      // Setup event handlers
      this.setupEventHandlers();

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  setupEventHandlers() {
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('reconnectFailed', () => {
      logger.error('MongoDB reconnection failed');
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  }

  async checkConnection() {
    return mongoose.connection.readyState === 1;
  }

  getConnection() {
    return mongoose.connection;
  }
}

// Export singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = {
  connectDB: () => databaseConnection.connect(),
  disconnectDB: () => databaseConnection.disconnect(),
  checkConnection: () => databaseConnection.checkConnection(),
  getConnection: () => databaseConnection.getConnection()
};