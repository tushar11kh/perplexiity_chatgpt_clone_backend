// src/routes/chat.ts
import { Router, Request, Response } from 'express';
import upload from '../middleware/upload';
import { Conversation, IChatMessage } from '../models/chat';
import { getAIResponse } from '../services/perplexityService';
import { Types } from 'mongoose';


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
 * Upload image to Cloudinary and attach to conversation
 */
router.post(
  '/image',
  upload.single('image'), // Expect 'image' field from Flutter
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const imageUrl = (req.file as any).path;

      const { conversationId, text, isUser, modelUsed } = req.body;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      conversation.messages.push({
        text: text || '',
        isUser: isUser === 'true',
        timestamp: new Date(),
        imageUrl,
        modelUsed,
      } as IChatMessage);

      await conversation.save();

      res.status(200).json({ message: 'Image uploaded', imageUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Upload failed', error: err });
    }
  }
);

/**
 * Chat endpoint: user message -> Perplexity -> AI response -> save both in MongoDB
 * Supports optional image upload if combined with middleware
 */
router.post(
  '/chat',
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const { conversationId, text, modelUsed } = req.body;

      if (!text && !req.file) {
        return res.status(400).json({ message: 'Text or image required' });
      }

      // Find or create conversation
      let conversation = conversationId
        ? await Conversation.findById(conversationId)
        : null;

      if (!conversation) {
        conversation = new Conversation({
          title: 'New Conversation',
          messages: [],
          modelUsed: modelUsed || 'sonar',
        });
      }

      // Save user message
      const userMessage: IChatMessage = {
        text: text || '',
        isUser: true,
        timestamp: new Date(),
        modelUsed: modelUsed || 'sonar',
      } as IChatMessage;

      if (req.file) {
        userMessage.imageUrl = (req.file as any).path;
      }

      conversation.messages.push(userMessage);

      // Call Perplexity AI only if text exists
      let aiMessage: IChatMessage | null = null;
if (text) {
  const aiResponse = await getAIResponse(
    [{ role: 'user', content: text }],
    modelUsed || 'sonar'
  );

  // Handle both string and array responses from Perplexity
  const aiText = Array.isArray(aiResponse) 
    ? aiResponse.map(item => item.content || item.text || JSON.stringify(item)).join(' ') 
    : aiResponse;

  aiMessage = {
    text: aiText as string, // Explicitly cast to string
    isUser: false,
    timestamp: new Date(),
    modelUsed: modelUsed || 'sonar',
  } as IChatMessage; // Explicitly type as IChatMessage

  conversation.messages.push(aiMessage);
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
      res.status(500).json({ message: 'Chat failed', error: err instanceof Error ? err.message : err });
    }
  }
);

export default router;
