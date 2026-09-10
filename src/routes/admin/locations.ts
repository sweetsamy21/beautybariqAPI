import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../lib/auth";
import { errStatus } from "../../lib/errors";

const router = Router();

const locationSchema = z.object({
  city: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  hours: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  type: z.enum(["SERVICE", "TRAINING"]).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const locations = await prisma.location.findMany({ orderBy: { displayOrder: "asc" } });
    return res.json({ success: true, data: locations });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const data = locationSchema.parse(req.body);
    const location = await prisma.location.create({ data });
    return res.status(201).json({ success: true, data: location });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/admin/locations]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const data = locationSchema.partial().parse(req.body);
    const location = await prisma.location.update({ where: { id: req.params.id }, data });
    return res.json({ success: true, data: location });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[PATCH /api/admin/locations/:id]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    await prisma.location.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[DELETE /api/admin/locations/:id]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

export default router;
