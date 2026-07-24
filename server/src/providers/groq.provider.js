import Groq from 'groq-sdk';
import { aiConfig } from '../config/ai.config.js';
import { AIProvider } from './ai.provider.js';
import logger from '../utils/logger.js'; // Assuming a logger exists, fallback to console if not

/**
 * Groq AI Provider Implementation
 * 
 * Implements the AIProvider interface using the official Groq SDK.
 * Handles retries, timeouts, and JSON parsing.
 */
export class GroqProvider extends AIProvider {
  constructor() {
    super();
    if (!aiConfig.groq.apiKey) {
      logger?.warn('Groq API Key is missing. AI features will fail.');
    }
    this.client = new Groq({
      apiKey: aiConfig.groq.apiKey,
      timeout: aiConfig.groq.timeout,
    });
    this.defaultModel = aiConfig.groq.model;
    this.temperature = aiConfig.groq.temperature;
    this.maxTokens = aiConfig.groq.maxTokens;
  }

  /**
   * Generate a structured JSON response
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    const retries = options.retries || 2;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const startTime = Date.now();
        const response = await this.client.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: options.model || this.defaultModel,
          temperature: options.temperature ?? this.temperature,
          max_tokens: options.maxTokens || this.maxTokens,
          response_format: { type: 'json_object' },
        });

        const latency = Date.now() - startTime;
        const resultText = response.choices[0]?.message?.content || '{}';
        
        logger?.info(`[Groq] generate() succeeded. Latency: ${latency}ms. Tokens: ${response.usage?.total_tokens}`);
        
        return JSON.parse(resultText);
      } catch (error) {
        attempt++;
        logger?.error(`[Groq] generate() failed on attempt ${attempt}: ${error.message}`);
        if (attempt > retries) {
          throw new Error(`AI generation failed after ${retries} retries: ${error.message}`);
        }
        // Simple backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Chat using conversation history
   */
  async chat(messages, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        messages,
        model: options.model || this.defaultModel,
        temperature: options.temperature ?? this.temperature,
        max_tokens: options.maxTokens || this.maxTokens,
      });
      return response.choices[0]?.message?.content;
    } catch (error) {
      logger?.error(`[Groq] chat() failed: ${error.message}`);
      throw new Error(`AI chat failed: ${error.message}`);
    }
  }

  /**
   * Verify API connectivity
   */
  async healthCheck() {
    try {
      // Send a minimal token request to test connectivity
      await this.client.chat.completions.create({
        messages: [{ role: 'user', content: 'ping' }],
        model: this.defaultModel,
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      logger?.error(`[Groq] healthCheck() failed: ${error.message}`);
      return false;
    }
  }
}
