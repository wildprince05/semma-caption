import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
config({ path: path.resolve(__dirname, '..', '..', '.env') });

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import captionsRouter from './routes/captions.js';
import posterRouter from './routes/poster.js';
import referencesRouter from './routes/references.js';
import healthRouter from './routes/health.js';
import { getGroqModel } from './services/ai.js';

// Global uncaught exception and rejection handlers to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION PREVENTED CRASH]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION PREVENTED CRASH]:', reason);
});

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Create uploads directory
const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use('/api', limiter);

// Routes
app.use('/api/captions', captionsRouter);
app.use('/api/poster', posterRouter);
app.use('/api/references', referencesRouter);
app.use('/api/health', healthRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize database
initializeDatabase();
seedDatabase();

app.listen(PORT, () => {
  const apiKey = (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  const keyLoaded = !!apiKey;
  const model = getGroqModel();
  console.log(`\n🟡 YELLOVERSE AI Caption Studio running at http://localhost:${PORT}`);
  console.log(`   API Health: http://localhost:${PORT}/api/health`);
  console.log(`   AI Provider: Groq (groq-sdk)`);
  console.log(`   Groq Model: ${model}`);
  console.log(`   Groq API Key: ${keyLoaded ? '✅ Configured (' + apiKey.slice(0, 8) + '...)' : '❌ MISSING in .env'}\n`);
});

export default app;
