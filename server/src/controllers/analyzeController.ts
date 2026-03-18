import { Request, Response } from 'express';
import sharp from 'sharp';
import { validationResult } from 'express-validator';
import { analyzeReport, chatFollowUp, compareTrends } from '../services/gradient';

export const AnalyzeController = {
  // ── POST /api/analyze ───────────────────────────────────────────────────────
  async analyze(req: Request, res: Response): Promise<void> {
    const logger = req.app.locals.logger;
    const { text } = req.body as { text?: string };

    if (!text && !req.file) {
      res.status(400).json({ error: 'Please provide report text or upload an image.' });
      return;
    }

    let imageBase64: string | null = null;
    let mimeType: string | null = null;

    try {
      if (req.file) {
        let buffer = req.file.buffer;
        const fileMime = req.file.mimetype;

        if (fileMime === 'application/pdf') {
          imageBase64 = buffer.toString('base64');
          mimeType = 'application/pdf';
        } else {
          // Resize + strip EXIF metadata (HIPAA compliance)
          buffer = await sharp(buffer)
            .resize({ width: 1800, height: 2400, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 88 })
            .withMetadata()
            .toBuffer();
          imageBase64 = buffer.toString('base64');
          mimeType = 'image/jpeg';
        }

        logger.info({
          event: 'file_processed',
          userId: req.user!.sub,
          mimeType,
          sizeKB: Math.round(buffer.length / 1024),
        });
      }

      logger.info({ event: 'analyze_start', userId: req.user!.sub });

      const result = await analyzeReport({ text: text ?? '', imageBase64, mimeType });

      // HIPAA: never log result — it contains PHI
      logger.info({ event: 'analyze_complete', userId: req.user!.sub });

      res.json({
        ...result,
        _meta: {
          hipaa_notice: 'This report was not stored on any server. Analysis is transient.',
          powered_by: 'Groq Serverless Inference',
          model: process.env.GRADIENT_MODEL ?? 'llama-3.3-70b-versatile',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      logger.error({ event: 'analyze_error', userId: req.user?.sub, message: error.message });

      if (error.message.includes('JSON')) {
        res.status(502).json({ error: 'AI returned an unexpected response. Please try again.' });
        return;
      }
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File too large. Maximum size is 10 MB.' });
        return;
      }
      res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }
  },

  // ── POST /api/analyze/chat ──────────────────────────────────────────────────
  async chat(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const logger = req.app.locals.logger;
    const { messages } = req.body as {
      messages: Array<{ role: string; content: string }>;
    };

    try {
      const sanitized = messages.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: String(m.content).slice(0, 2000),
      }));

      const reply = await chatFollowUp(sanitized);
      res.json({ reply });
    } catch (err) {
      const error = err as Error;
      logger.error({ event: 'chat_error', userId: req.user?.sub, message: error.message });
      res.status(500).json({ error: 'Chat failed. Please try again.' });
    }
  },

  // ── POST /api/analyze/compare ───────────────────────────────────────────────
  async compare(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const logger = req.app.locals.logger;
    const { reportA, reportB } = req.body as { reportA: string; reportB: string };

    try {
      const result = await compareTrends(reportA, reportB);
      res.json(result);
    } catch (err) {
      const error = err as Error;
      logger.error({ event: 'compare_error', userId: req.user?.sub, message: error.message });
      res.status(500).json({ error: 'Comparison failed. Please try again.' });
    }
  },
};
