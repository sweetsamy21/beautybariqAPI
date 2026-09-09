import jwt from "jsonwebtoken";
import { Request } from "express";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return (req.cookies as Record<string, string>)?.token ?? null;
}

export function requireAuth(req: Request): JwtPayload {
  const token = getTokenFromRequest(req);
  if (!token) throw new Error("Unauthorized");
  return verifyToken(token);
}

export function requireAdmin(req: Request): JwtPayload {
  const payload = requireAuth(req);
  if (payload.role !== "ADMIN") throw new Error("Forbidden");
  return payload;
}
