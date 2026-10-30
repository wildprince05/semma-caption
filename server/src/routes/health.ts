import express from 'express';
import { isDatabaseHealthy, getTableCount } from '../db/database.js';
import { verifyGroqStatus } from '../services/ai.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const healthy = isDatabaseHealthy();
  const refCount = getTableCount('references_table');
  const groqStatus = await verifyGroqStatus();

  res.json({
    status: groqStatus.connected ? 'ok' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: healthy ? 'connected' : 'error',
    references: refCount,
    aiProvider: {
      provider: 'groq',
      sdk: 'groq-sdk',
      connected: groqStatus.connected,
      model: groqStatus.configuredModel,
      modelAvailable: groqStatus.modelAvailable,
      supportsVision: groqStatus.supportsVision,
      availableModelsCount: groqStatus.availableModels.length,
      error: groqStatus.error,
    },
  });
});

export default router;
