import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Defaults to real service locations only (Prosper, Midland) — Frisco is
// The Aesthetic Equation's training hub, not somewhere Beauty Bar IQ sees
// clients, and must never appear in a public "book a location" list.
// ?type=all is for internal/admin use (e.g. mentioning the training hub
// on the /training page) where showing it is actually correct.
router.get("/", async (req: Request, res: Response) => {
  try {
    const includeAll = req.query.type === "all";
    const locations = await prisma.location.findMany({
      where: { isActive: true, ...(includeAll ? {} : { type: "SERVICE" }) },
      orderBy: { displayOrder: "asc" },
    });
    return res.json({ success: true, data: locations });
  } catch (err) {
    console.error("[GET /api/locations]", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
