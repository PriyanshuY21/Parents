import { Request, Response } from 'express';
import { HistoryModel } from '../models/historyModel';

export const HistoryController = {
  // ── GET /api/history ────────────────────────────────────────────────────────
  getAll(req: Request, res: Response): void {
    const history = HistoryModel.getByUser(req.user!.sub);
    res.json({ history });
  },

  // ── POST /api/history ───────────────────────────────────────────────────────
  create(req: Request, res: Response): void {
    const { title, status, findingsCount, flaggedCount } = req.body as {
      title?: string;
      status?: string;
      findingsCount?: number;
      flaggedCount?: number;
    };

    const entry = HistoryModel.buildEntry({ title, status, findingsCount, flaggedCount });
    HistoryModel.add(req.user!.sub, entry);
    res.status(201).json({ entry });
  },

  // ── DELETE /api/history/:id ─────────────────────────────────────────────────
  deleteOne(req: Request, res: Response): void {
    const deleted = HistoryModel.remove(req.user!.sub, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Entry not found.' });
      return;
    }
    res.json({ success: true });
  },

  // ── DELETE /api/history ─────────────────────────────────────────────────────
  deleteAll(req: Request, res: Response): void {
    HistoryModel.clearAll(req.user!.sub);
    res.json({ success: true });
  },
};
