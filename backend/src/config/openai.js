// ============================================
// src/config/openai.js
// ============================================
module.exports = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3,
  timeout: 60000, // 60 seconds
  maxRetries: 3
};