import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../lib/auth";
import { errStatus } from "../../lib/errors";

const router = Router();

const faqSchema = z.object({ question: z.string().min(1), answer: z.string().min(1) });

const serviceSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  shortDescription: z.string().min(1),
  description: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  candidateInfo: z.array(z.string()).optional(),
  whatToExpect: z.array(z.string()).optional(),
  heroImage: z.string().optional().nullable(),
  heroImagePosition: z.string().optional().nullable(),
  faqs: z.array(faqSchema).optional(),
  isPriority: z.boolean().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const services = await prisma.service.findMany({ orderBy: { displayOrder: "asc" } });
    return res.json({ success: true, data: services });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const data = serviceSchema.parse(req.body);
    const existing = await prisma.service.findUnique({ where: { slug: data.slug } });
    if (existing) return res.status(409).json({ success: false, error: "A service with this slug already exists." });
    const service = await prisma.service.create({ data });
    return res.status(201).json({ success: true, data: service });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/admin/services]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const data = serviceSchema.partial().parse(req.body);
    const service = await prisma.service.update({ where: { id: req.params.id }, data });
    return res.json({ success: true, data: service });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[PATCH /api/admin/services/:id]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    await prisma.service.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[DELETE /api/admin/services/:id]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

export default router;
