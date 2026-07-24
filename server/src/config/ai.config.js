import dotenv from 'dotenv';

dotenv.config();

/**
 * AI Configuration Module
 * Exports immutable AI settings loaded from environment variables.
 */
export const aiConfig = Object.freeze({
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama3-70b-8192',
    timeout: parseInt(process.env.AI_TIMEOUT, 10) || 10000,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 1024,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.2,
  },
});
