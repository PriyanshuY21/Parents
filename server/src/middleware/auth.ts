import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/tokenService';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    return;
  }

  const token = header.slice(7);

  try {
    req.user = await verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid.' });
  }
}
