# Perplexity API Backend Documentation

## Project Overview
This is a Node.js/Express TypeScript backend that powers a multi-modal chat application with AI capabilities, designed to connect with a Flutter frontend.

## Tech Stack

### Core Technologies
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Cloudinary for image management
- **AI Service**: Perplexity AI for intelligent responses

### Key Dependencies
- `express` - Web server framework
- `mongoose` - MongoDB object modeling
- `cloudinary` - Cloud image and video management
- `multer` & `multer-storage-cloudinary` - File upload handling
- `@perplexity-ai/perplexity_ai` - AI API integration
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management

## Architecture & Flow

### Project Structure
```
src/
├── config/          # Third-party service configurations
├── middleware/      # Custom Express middleware
├── models/          # MongoDB schemas and interfaces
├── routes/          # API route handlers
├── services/        # External service integrations
└── utils/           # Utilities and helpers
```

### Data Flow
1. **Client Request** → Flutter app sends chat messages/images
2. **Upload Handling** → Multer middleware processes files to Cloudinary
3. **AI Processing** → Perplexity service generates intelligent responses
4. **Data Persistence** → MongoDB stores conversations and messages
5. **Response** → Cleaned AI response sent back to client

### Key Features

#### Multi-Modal Chat Support
- Handles both text and image messages
- Converts local images to base64 for AI processing
- Preserves Cloudinary URLs for efficient storage

#### AI Integration
- Perplexity AI with multi-modal capabilities
- Citation cleaning from AI responses
- Configurable model parameters (temperature, tokens, filters)

#### Conversation Management
- Full CRUD operations for chat histories
- Automatic conversation threading
- Support for both single and multiple images per message

#### File Handling
- Automated image optimization (800x800 resize)
- Multiple format support (JPG, PNG, GIF, WebP)
- Cloudinary integration for scalable storage

## API Endpoints

### Chat Operations
- `POST /api/chat` - Send message with optional image
- `POST /api/conversation` - Create new conversation
- `GET /api/conversations` - Get all conversations
- `PATCH /api/conversation/:id` - Update conversation title
- `DELETE /api/conversation/:id` - Delete conversation

## Environment Configuration
Required environment variables:
- `PORT` - Server port (default: 5001)
- `MONGODB_URI` - MongoDB connection string
- `PERPLEXITY_API_KEY` - AI service API key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## Error Handling
- Comprehensive error catching across all routes
- Specific error types for Perplexity API failures
- Graceful fallbacks for missing data
- Structured error responses for client consumption

---

## For Flutter ChatGPT UI integreation

Go to this [link.](https://github.com/tushar11kh/chatgpt_clone_flutter)