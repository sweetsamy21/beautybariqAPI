import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { Lead } from "@prisma/client";

// Reuses AWS SES — already configured and paid-for in this same AWS
// account for theaestheticequationAPI — rather than introducing a second
// email/messaging platform for one notification email (see §45 of the
// Phase 3 brief: "Do not introduce another paid messaging platform
// unnecessarily"). Sends from gina@beautybariq.com specifically because
// that's a real, already-in-use inbox that can complete SES's identity
// verification (a noreply@ address nobody checks can't click the
// verification link SES sends).
const ses = new SESClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const FROM = process.env.SES_FROM ?? "gina@beautybariq.com";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Fire-and-forget — a lead is already saved by the time this is called, so a failed/slow email never blocks or fails the visitor's submission. */
export async function notifyNewLead(lead: Lead, notifyEmail: string): Promise<void> {
  const rows: [string, string | null | undefined][] = [
    ["Name", [lead.firstName, lead.lastName].filter(Boolean).join(" ")],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Preferred location", lead.preferredLocation],
    ["Service interest", lead.serviceInterest],
    ["Product interest", lead.productInterest],
    ["Message", lead.message],
    ["Source", lead.source],
    ["Landing page", lead.landingPage],
  ];

  const rowsHtml = rows
    .filter(([, v]) => v)
    .map(
      ([label, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6e5850;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#241a17;font-size:14px;">${escapeHtml(String(v))}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:32px 20px;background:#faf7f5;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e8d6cf;">
<tr><td style="padding:28px 32px 8px;">
<p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b4707a;">Beauty Bar IQ</p>
<h1 style="margin:6px 0 0;font-size:20px;font-weight:normal;color:#241a17;">New website lead</h1>
</td></tr>
<tr><td style="padding:16px 32px 28px;">
<table cellpadding="0" cellspacing="0">${rowsHtml}</table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  try {
    await ses.send(
      new SendEmailCommand({
        Source: FROM,
        Destination: { ToAddresses: [notifyEmail] },
        Message: {
          Subject: { Data: `New lead: ${lead.firstName}${lead.serviceInterest ? ` — ${lead.serviceInterest}` : ""}` },
          Body: { Html: { Data: html } },
        },
        ReplyToAddresses: lead.email ? [lead.email] : undefined,
      })
    );
  } catch (err) {
    console.error("[notifyNewLead] failed to send lead notification email", err);
  }
}
