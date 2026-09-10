import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../lib/auth";
import { errStatus } from "../../lib/errors";

const router = Router();

const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "APPOINTMENT_SCHEDULED", "CONVERTED", "LOST", "ARCHIVED"] as const;

const updateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().optional().nullable(),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const status = req.query.status as string | undefined;
    const leads = await prisma.lead.findMany({
      where: status && LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number]) ? { status: status as (typeof LEAD_STATUSES)[number] } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: leads });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    const data = updateSchema.parse(req.body);
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data });
    return res.json({ success: true, data: lead });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[PATCH /api/admin/leads/:id]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    await prisma.lead.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[DELETE /api/admin/leads/:id]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

export default router;
