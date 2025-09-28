// src/routes/chat.ts
import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';
import { Conversation, IChatMessage } from '../models/chat';
import { getAIResponse } from '../services/perplexityService';
import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const router = Router();

/**
 * Create a new conversation
 */
router.post('/conversation', async (req, res) => {
  try {
    const { title, messages, modelUsed } = req.body;
    const conversation = new Conversation({ title, messages, modelUsed });
    await conversation.save();
    res.json({ success: true, conversation });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: 'Unknown error' });
    }
  }
});

/**
 * Get all conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 });
    res.json(conversations);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

/**
 * Chat endpoint: user message (+ optional image) -> Perplexity -> AI response
 * Supports multi-modal messages with images and domain/format filters
 */
router.post(
  '/chat',
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const { conversationId, text, modelUsed, imageFormatFilter, imageDomainFilter } = req.body;

      if (!text && !req.file) {
        return res.status(400).json({ message: 'Text or image required' });
      }

      // Find existing conversation if conversationId is provided
      let conversation = conversationId
        ? await Conversation.findById(conversationId)
        : null;

      // If no existing conversation, create new one
      if (!conversation) {
        conversation = new Conversation({
          title: 'New Conversation',
          messages: [],
          modelUsed: modelUsed || 'sonar',
        });
      }

      // Prepare user message
      const userMessage: Partial<IChatMessage> = {
        text: text || '',
        isUser: true,
        timestamp: new Date(),
        modelUsed: modelUsed || 'sonar',
      };

      // If user uploaded an image, convert it to base64
      let imageDataUri: string | undefined;
      if (req.file) {
  const filePath = req.file.path;

  // Check if the file path is a URL (starts with http/https)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    // Use URL directly
    imageDataUri = filePath;
  } else {
    // Local file, convert to base64
    const resolvedPath = path.resolve(filePath);
    const fileBuffer = await readFile(resolvedPath);
    const mimeType = req.file.mimetype; // e.g., 'image/png'

    imageDataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  userMessage.imageUrl = imageDataUri;
}

      conversation.messages.push(userMessage as IChatMessage);

      // Prepare messages for Sonar API (multi-modal)
      const messagesForAI: any[] = conversation.messages.map((msg) => {
        const contentArray: any[] = [];
        if (msg.text) {
          contentArray.push({ type: 'text', text: msg.text });
        }
        if (msg.imageUrl) {
          contentArray.push({ type: 'image_url', image_url: { url: msg.imageUrl } });
        }
        return {
          role: msg.isUser ? 'user' : 'assistant',
          content: contentArray,
        };
      });

      // Call Perplexity API if there is text or image
      let aiMessage: Partial<IChatMessage> | null = null;

      if (text || req.file) {
        const aiResponse = await getAIResponse(messagesForAI, modelUsed || 'sonar', {
          return_images: true,
          image_format_filter: imageFormatFilter ? JSON.parse(imageFormatFilter) : undefined,
          image_domain_filter: imageDomainFilter ? JSON.parse(imageDomainFilter) : undefined,
        });

        // Flatten AI response text + images
        let aiText = '';
        let aiImages: string[] = [];

        if (Array.isArray(aiResponse)) {
          aiResponse.forEach((item: any) => {
            if (item.content) aiText += item.content + ' ';
            if (item.images && Array.isArray(item.images)) aiImages.push(...item.images);
          });
        } else if (typeof aiResponse === 'object') {
          aiText = aiResponse.content || '';
          if (aiResponse.images && Array.isArray(aiResponse.images)) aiImages = aiResponse.images;
        } else {
          aiText = String(aiResponse);
        }

        aiMessage = {
          text: aiText.trim(),
          images: aiImages,
          isUser: false,
          timestamp: new Date(),
          modelUsed: modelUsed || 'sonar',
        };

        conversation.messages.push(aiMessage as IChatMessage);
      }

      await conversation.save();

      // Return last 2 messages (user + AI)
      const lastMessages = conversation.messages.slice(-2);

      res.json({
        success: true,
        conversationId: conversation._id,
        messages: lastMessages,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: 'Chat failed',
        error: err instanceof Error ? err.message : err,
      });
    }
  }
);

// Add to src/routes/chat.ts
router.patch('/conversation/:id', async (req, res) => {
  try {
    const { title } = req.body;
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );
    res.json({ success: true, conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : err, });
  }
});

/**
 * Delete a conversation
 */
router.delete('/conversation/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: 'Unknown error' });
    }
  }
});

export default router;
