import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

const VALID_PAGES = [
  "home",
  "about-us",
  "toxins",
  "filler",
  "facials",
  "morpheus",
  "microneedling",
  "skincare",
  "iv-drips",
  "weight-management",
  "sexual-wellness",
  "training",
  "payment-plans",
  "testimonials",
  "privacy-policy",
] as const;

router.get("/:page", async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    if (!(VALID_PAGES as readonly string[]).includes(page)) {
      return res.status(404).json({ success: false, error: "Unknown page" });
    }

    const row = await prisma.pageContent.findUnique({ where: { id: page } });
    return res.json({ success: true, data: row?.data ?? {} });
  } catch (err) {
    console.error("[GET /api/pages/:page]", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
