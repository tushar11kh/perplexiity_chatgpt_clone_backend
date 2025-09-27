// src/services/perplexityService.ts
import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponseOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  return_images?: boolean;
  search_recency_filter?: 'day' | 'week' | 'month';
  search_domain_filter?: string[];
}

/**
 * Helper function to get AI response from Perplexity
 * Handles both string responses and array-of-chunks responses
 */
export async function getAIResponse(
  messages: ChatMessage[],
  model: string,
  options?: AIResponseOptions
): Promise<string | any[]> {
  try {
    const completion = await client.chat.completions.create({
      messages,
      model,
      ...options,
    });

    const content = completion.choices[0]?.message.content;

    if (!content) return 'No response';

    // If content is an array of chunks (image, file, text, etc.), return as-is
    if (Array.isArray(content)) {
      return content;
    }

    // Otherwise, return string
    return content;
  } catch (error: any) {
    if (error instanceof Perplexity.BadRequestError) {
      console.error(`Invalid request parameters: ${error.message}`);
      throw new Error(`BadRequest: ${error.message}`);
    } else if (error instanceof Perplexity.RateLimitError) {
      console.error('Rate limit exceeded, please retry later');
      throw new Error('RateLimitExceeded');
    } else if (error instanceof Perplexity.APIError) {
      console.error(`API error ${error.status}: ${error.message}`);
      throw new Error(`APIError: ${error.message}`);
    } else {
      console.error('Unexpected Perplexity error:', error);
      throw new Error('UnexpectedError');
    }
  }
}

export default client;
