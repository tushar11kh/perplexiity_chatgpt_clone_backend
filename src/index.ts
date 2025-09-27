import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './utils/config';
import { connectDB } from './utils/db';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', chatRoutes);

// Connect MongoDB
connectDB();

app.get('/', (req, res) => {
  res.send('ChatGPT Clone Backend Running');
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
