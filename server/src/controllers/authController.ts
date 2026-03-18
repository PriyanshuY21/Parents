import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import { signToken } from '../services/tokenService';
import { UserModel } from '../models/userModel';
import { User } from '../types/index';

export const AuthController = {
  // ── POST /api/auth/register ─────────────────────────────────────────────────
  async register(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name: string;
    };

    if (UserModel.exists(email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const id = `u_${uuidv4()}`;
    const user: User = { id, name, email, hash, createdAt: new Date().toISOString() };
    UserModel.create(user);

    const token = await signToken({ sub: id, name, email });
    res.status(201).json({ token, user: { id, name, email } });
  },

  // ── POST /api/auth/login ────────────────────────────────────────────────────
  async login(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };
    const user = UserModel.findByEmail(email);

    // Constant-time comparison — prevents user enumeration via timing
    const dummyHash = '$2a$12$invalidhashforenumprotection000000000000000000000';
    const match = user
      ? await bcrypt.compare(password, user.hash)
      : (await bcrypt.compare(password, dummyHash)) && false;

    if (!user || !match) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = await signToken({ sub: user.id, name: user.name, email: user.email });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  },

  // ── GET /api/auth/me ────────────────────────────────────────────────────────
  me(req: Request, res: Response): void {
    res.json({ user: req.user });
  },
};
