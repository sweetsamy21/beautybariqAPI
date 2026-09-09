import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Public, unauthenticated — the Navbar/Footer/booking buttons on every page
// need this (booking URL, phone, email, socials, logo), same convention as
// theaestheticequationUI's Navbar fetching /api/admin/settings/public.
router.get("/", async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
