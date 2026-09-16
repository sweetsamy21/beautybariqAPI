import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken, getTokenFromRequest, verifyToken, requireAuth } from "../lib/auth";
import { errStatus } from "../lib/errors";

const router = Router();

// No public self-registration — this site has one (or a small handful of)
// admin account(s), created via prisma/seed.ts, not a signup form.

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7 * 1000,
  path: "/",
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.cookie("token", token, COOKIE_OPTIONS);
    return res.json({
      success: true,
      data: { id: user.id, email: user.email, firstName: user.firstName, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid input" });
    }
    console.error("[POST /api/auth/login]", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.cookie("token", "", { maxAge: 0, path: "/" });
  return res.json({ success: true });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post("/change-password", async (req: Request, res: Response) => {
  try {
    const payload = requireAuth(req);
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, error: "Current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    }
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/auth/change-password]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.get("/me", (req: Request, res: Response) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ success: false, error: "Unauthorized" });

    const payload = verifyToken(token);
    return res.json({
      success: true,
      data: { userId: payload.userId, email: payload.email, role: payload.role },
    });
  } catch {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
});

export default router;
