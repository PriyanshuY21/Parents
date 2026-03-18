import express, { Router } from 'express';
import { HistoryController } from '../controllers/historyController';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();

router.get('/',    requireAuth, HistoryController.getAll);
router.post('/',   requireAuth, HistoryController.create);
router.delete('/:id', requireAuth, HistoryController.deleteOne);
router.delete('/', requireAuth, HistoryController.deleteAll);

export default router;
