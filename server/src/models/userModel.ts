import { User } from '../types/index';

// ── In-memory user store (Model) ──────────────────────────────────────────────
// HIPAA: No PHI stored — only email + hashed password + opaque ID.
// For production: swap with an encrypted-at-rest database.
const users = new Map<string, User>();

export const UserModel = {
  findByEmail(email: string): User | undefined {
    return users.get(email);
  },

  exists(email: string): boolean {
    return users.has(email);
  },

  create(user: User): User {
    users.set(user.email, user);
    return user;
  },
};
