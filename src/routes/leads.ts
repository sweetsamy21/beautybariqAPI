import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { checkHoneypot } from "../lib/bot-check";
import { notifyNewLead } from "../lib/email";

const router = Router();

// Marketing-lead fields only — see the Lead model's comment. firstName +
// email are the only hard requirements so a visitor can submit from a
// short, low-friction form (general consultation) or a fuller one
// (service/location-specific) without the schema forcing a redesign.
const leadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  preferredLocation: z.string().optional(),
  serviceInterest: z.string().optional(),
  productInterest: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  landingPage: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  referralUrl: z.string().optional(),
  consent: z.boolean().optional(),
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const bot = checkHoneypot(req.body);
    if (!bot.ok) {
      // Reply success to a bot without writing a row — indistinguishable
      // from a real submission on the wire, nothing to learn by probing.
      return res.json({ success: true });
    }

    const data = leadSchema.parse(req.body);
    const lead = await prisma.lead.create({ data });

    // Awaited (not fire-and-forget) — under Lambda, a dangling promise still
    // in flight when the response returns can get frozen mid-send and never
    // actually complete, so this accepts SES's ~200-500ms latency here
    // rather than risk the notification silently never going out.
    const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
    await notifyNewLead(lead, settings?.email ?? "gina@beautybariq.com");

    return res.status(201).json({ success: true, data: { id: lead.id } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid input", details: err.issues });
    }
    console.error("[POST /api/leads]", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
