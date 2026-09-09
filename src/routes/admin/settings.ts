import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../lib/auth";
import { errStatus } from "../../lib/errors";

const router = Router();

const settingsSchema = z.object({
  bookingUrl: z.string().url().optional(),
  bookingLabel: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  instagramUrl: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const settings = await prisma.siteSettings.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {},
    });
    return res.json({ success: true, data: settings });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.patch("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const data = settingsSchema.parse(req.body);
    const settings = await prisma.siteSettings.upsert({
      where: { id: "site" },
      create: { id: "site", ...data },
      update: data,
    });
    return res.json({ success: true, data: settings });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[PATCH /api/admin/settings]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

export default router;
