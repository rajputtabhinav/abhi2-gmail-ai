import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { query } from "../config/db";

export type SessionUser = { id: string; email: string };

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

let _cachedUser: SessionUser | null = null;

async function getLocalUser(): Promise<SessionUser> {
  if (_cachedUser) return _cachedUser;
  const result = await query<{ id: string; email: string }>(
    `
      INSERT INTO users (email, name)
      VALUES ($1, 'Admin')
      ON CONFLICT (email) DO UPDATE SET updated_at = now()
      RETURNING id, email
    `,
    [env.LOCAL_USER_EMAIL],
  );
  _cachedUser = result.rows[0];
  return _cachedUser!;
}

/** No-op — kept for compatibility with auth.service.ts callers (Gmail connect flow). */
export function issueSessionToken(_user: SessionUser) { return ""; }
export function setSessionCookies(_res: Response, _token: string) { return; }
export function clearSessionCookies(_res: Response) { return; }

export const SESSION_COOKIE = "abhi2_session";
export const CSRF_COOKIE = "abhi2_csrf";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.user = await getLocalUser();
  next();
}

export function csrfMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}
