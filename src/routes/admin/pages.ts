import { Router, Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../lib/auth";
import { errStatus } from "../../lib/errors";

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
  "terms-and-conditions",
] as const;
type PageId = (typeof VALID_PAGES)[number];

function isValidPage(page: string): page is PageId {
  return (VALID_PAGES as readonly string[]).includes(page);
}

// Content is stored as a loose JSON blob — shape is defined and validated on
// the frontend's per-page field config, not enforced here. Every field is
// optional; the public GET route merges this over hardcoded page defaults,
// so a never-edited page renders exactly as it always has.
const dataSchema = z.record(z.string(), z.unknown());

router.get("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const rows = await prisma.pageContent.findMany();
    return res.json({ success: true, data: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.get("/:page", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const { page } = req.params;
    if (!isValidPage(page)) return res.status(404).json({ success: false, error: "Unknown page" });

    const row = await prisma.pageContent.findUnique({ where: { id: page } });
    return res.json({ success: true, data: row?.data ?? {} });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.patch("/:page", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const { page } = req.params;
    if (!isValidPage(page)) return res.status(404).json({ success: false, error: "Unknown page" });

    const data = dataSchema.parse(req.body) as Prisma.InputJsonValue;
    const row = await prisma.pageContent.upsert({
      where: { id: page },
      create: { id: page, data },
      update: { data },
    });
    return res.json({ success: true, data: row.data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    }
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[PATCH /api/admin/pages/:page]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

export default router;
