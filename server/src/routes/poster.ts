import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { analyzePoster } from '../services/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, JPEG and WebP images are supported'));
    }
  },
});

router.post('/analyze', upload.single('poster'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded. Use field name "poster".' });
  }

  const { path: filePath, mimetype } = req.file;

  try {
    const buffer = fs.readFileSync(filePath);
    const { eventData, confidence } = await analyzePoster(buffer, mimetype);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    return res.json({ extractedData: eventData, confidence, eventData });
  } catch (err) {
    // Clean up on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const message = err instanceof Error ? err.message : 'Poster analysis failed';
    return res.status(500).json({ error: message });
  }
});

export default router;

