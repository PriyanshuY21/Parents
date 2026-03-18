import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});

const registerValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[0-9]/).withMessage('Must contain a number'),
  body('name').trim().isLength({ min: 2, max: 80 }),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', authLimiter, registerValidators, AuthController.register);
router.post('/login',    authLimiter, loginValidators,    AuthController.login);
router.get('/me',        requireAuth,                     AuthController.me);

export default router;
