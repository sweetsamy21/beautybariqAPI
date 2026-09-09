import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });
    return res.json({ success: true, data: testimonials });
  } catch (err) {
    console.error("[GET /api/testimonials]", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
