import { Schema, model, Document } from 'mongoose';

export interface IChatMessage extends Document {
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string;
  modelUsed: string;
}

export interface IConversation extends Document {
  title: string;
  createdAt: Date;
  messages: IChatMessage[];
  modelUsed: string;
}

// ChatMessage schema
const ChatMessageSchema = new Schema<IChatMessage>({
  text: { type: String, required: true },
  isUser: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  imageUrl: { type: String },
  modelUsed: { type: String, required: true },
});

// Conversation schema
const ConversationSchema = new Schema<IConversation>({
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  messages: { type: [ChatMessageSchema], default: [] },
  modelUsed: { type: String, required: true },
});

export const Conversation = model<IConversation>('Conversation', ConversationSchema);
