// src/services/ai/AIOrchestrator.js
const OpenAI = require('openai');
const pRetry = require('p-retry');
const openaiConfig = require('../../config/openai');
const PromptBuilder = require('./PromptBuilder');
const logger = require('../../utils/logger');

class AIOrchestrator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: openaiConfig.apiKey,
      timeout: openaiConfig.timeout
    });
    this.model = openaiConfig.model;
    this.maxTokens = openaiConfig.maxTokens;
    this.temperature = openaiConfig.temperature;
  }

  /**
   * Analyze quote document
   */
  async analyzeQuote(extractedText, tier, metadata = {}) {
    try {
      logger.info(`Starting AI analysis for tier: ${tier}`);

      const systemPrompt = PromptBuilder.buildSystemPrompt(tier);
      const userPrompt = PromptBuilder.buildUserPrompt(extractedText, metadata);

      const response = await this.callOpenAI(systemPrompt, userPrompt);
      const parsed = this.parseResponse(response, tier);

      logger.info(`AI analysis completed for tier: ${tier}`);

      return parsed;
    } catch (error) {
      logger.error('AI analysis failed:', error);
      throw new Error('AI analysis failed. Please try again.');
    }
  }

  /**
   * Compare multiple quotes (Premium only)
   */
  async compareQuotes(quotes, metadata = {}) {
    try {
      logger.info(`Starting quote comparison for ${quotes.length} quotes`);

      const systemPrompt = PromptBuilder.buildComparisonSystemPrompt();
      const userPrompt = PromptBuilder.buildComparisonUserPrompt(quotes, metadata);

      const response = await this.callOpenAI(systemPrompt, userPrompt);
      const parsed = this.parseComparisonResponse(response);

      logger.info('Quote comparison completed');

      return parsed;
    } catch (error) {
      logger.error('Quote comparison failed:', error);
      throw new Error('Quote comparison failed. Please try again.');
    }
  }

  /**
   * Call OpenAI API with retry logic
   */
  async callOpenAI(systemPrompt, userPrompt) {
    return pRetry(
      async () => {
        const completion = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          response_format: { type: 'json_object' }
        });

        return completion;
      },
      {
        retries: openaiConfig.maxRetries,
        onFailedAttempt: (error) => {
          logger.warn(
            `OpenAI API attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
            { error: error.message }
          );
        }
      }
    );
  }

  /**
   * Parse and validate response
   */
  parseResponse(response, tier) {
    try {
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);

      // Validate structure
      if (tier === 'free') {
        if (!parsed.freeSummary) {
          throw new Error('Invalid AI response structure for free tier');
        }
      } else {
        if (!parsed.analysis) {
          throw new Error('Invalid AI response structure for paid tier');
        }
      }

      // Track usage
      const usage = {
        model: response.model,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
        finishReason: response.choices[0].finish_reason
      };

      return {
        ...parsed,
        aiResponse: usage
      };
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Parse comparison response
   */
  parseComparisonResponse(response) {
    try {
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);

      if (!parsed.comparison) {
        throw new Error('Invalid AI comparison response structure');
      }

      return parsed;
    } catch (error) {
      logger.error('Failed to parse comparison response:', error);
      throw new Error('Failed to parse comparison response');
    }
  }
}

module.exports = new AIOrchestrator();