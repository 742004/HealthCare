/**
 * Abstract AI Provider
 * 
 * Defines the contract that any AI provider (Groq, OpenAI, Gemini) must implement.
 * This ensures the application is completely decoupled from the specific AI vendor.
 */
export class AIProvider {
  /**
   * Generate a response from the AI model
   * @param {string} systemPrompt 
   * @param {string} userPrompt 
   * @param {object} options 
   * @returns {Promise<any>}
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    throw new Error('Method "generate()" must be implemented.');
  }

  /**
   * Chat with the AI model using a conversation history
   * @param {Array} messages 
   * @param {object} options 
   * @returns {Promise<any>}
   */
  async chat(messages, options = {}) {
    throw new Error('Method "chat()" must be implemented.');
  }

  /**
   * Check if the AI provider is available
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    throw new Error('Method "healthCheck()" must be implemented.');
  }
}
