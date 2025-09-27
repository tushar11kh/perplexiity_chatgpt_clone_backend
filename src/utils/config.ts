import dotenv from 'dotenv';

dotenv.config(); // loads .env automatically

export const config = {
  port: process.env.PORT || 5001,
  perplexityApiKey: process.env.PERPLEXITY_API_KEY || '',
  mongoUri: process.env.MONGODB_URI || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

// Optional: validate required variables
if (!config.perplexityApiKey) {
  throw new Error('Missing PERPLEXITY_API_KEY in environment variables');
}
if (!config.mongoUri) {
  throw new Error('Missing MONGODB_URI in environment variables');
}
