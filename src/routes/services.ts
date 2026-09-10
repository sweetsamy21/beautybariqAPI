import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const priorityOnly = req.query.priority === "true";
    const services = await prisma.service.findMany({
      where: { isActive: true, ...(priorityOnly ? { isPriority: true } : {}) },
      orderBy: { displayOrder: "asc" },
    });
    return res.json({ success: true, data: services });
  } catch (err) {
    console.error("[GET /api/services]", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const service = await prisma.service.findUnique({ where: { slug: req.params.slug } });
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    return res.json({ success: true, data: service });
  } catch (err) {
    console.error("[GET /api/services/:slug]", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
