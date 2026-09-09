import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../lib/auth";
import { errStatus } from "../../lib/errors";

const router = Router();

const testimonialSchema = z.object({
  name: z.string().min(1),
  quote: z.string().min(1),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const testimonials = await prisma.testimonial.findMany({ orderBy: { displayOrder: "asc" } });
    return res.json({ success: true, data: testimonials });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const data = testimonialSchema.parse(req.body);
    const testimonial = await prisma.testimonial.create({ data });
    return res.status(201).json({ success: true, data: testimonial });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/admin/testimonials]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const data = testimonialSchema.partial().parse(req.body);
    const testimonial = await prisma.testimonial.update({ where: { id: req.params.id }, data });
    return res.json({ success: true, data: testimonial });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[PATCH /api/admin/testimonials/:id]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[DELETE /api/admin/testimonials/:id]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

export default router;
