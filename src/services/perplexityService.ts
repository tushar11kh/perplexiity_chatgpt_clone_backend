// src/services/perplexityService.ts
import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface AIResponseOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  return_images?: boolean;
  image_format_filter?: string[];
  image_domain_filter?: string[];
  search_recency_filter?: 'day' | 'week' | 'month';
}

/**
 * Helper function to get AI response from Perplexity
 * Supports multi-modal messages (text + images)
 * Returns both text and images from the AI response
 */
export async function getAIResponse(
  messages: ChatMessage[],
  model: string,
  options?: AIResponseOptions
): Promise<{ content: string; images?: string[] }> {
  try {
    // Send messages as-is (array of objects with type: text | image_url)
    const completion = await client.chat.completions.create({
  model,
  messages: messages.map((msg) => ({
    role: msg.role,
    content: msg.content.map((c) => {
      if (c.type === 'image_url' && c.image_url) {
        return { type: 'image_url', image_url: c.image_url.url }; // Pass string directly
      }
      return { type: 'text', text: c.text || '' };
    }),
  })),
  ...options,
});


    const rawContent = completion.choices[0]?.message.content;

    if (!rawContent) return { content: '' };

    // If response is an array (multi-modal), extract text + images
    if (Array.isArray(rawContent)) {
      let combinedText = '';
      const images: string[] = [];

      rawContent.forEach((item: any) => {
        if (item.type === 'text' && item.text) {
          combinedText += item.text + ' ';
        }
        if (item.type === 'image_url' && item.image_url?.url) {
          images.push(item.image_url.url);
        }
      });

      return { content: combinedText.trim(), images: images.length > 0 ? images : undefined };
    }

    // If response is a simple string
    if (typeof rawContent === 'string') {
      return { content: rawContent };
    }

    // Fallback: return JSON stringified response
    return { content: JSON.stringify(rawContent) };
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
