// Mirrors theaestheticequationAPI's src/lib/bot-check.ts — a hidden
// honeypot field (_h) real visitors never fill in, plus a minimum
// time-on-page check (_t) to catch a form submitted faster than a human
// could actually fill it out. No CAPTCHA — frictionless for real visitors.
export function checkHoneypot(body: Record<string, unknown>): { ok: boolean; reason?: string } {
  if (typeof body._h === "string" && body._h.length > 0) {
    return { ok: false, reason: "bot" };
  }
  if (typeof body._t === "string") {
    const loadTime = parseInt(body._t, 10);
    if (!isNaN(loadTime) && Date.now() - loadTime < 500) {
      return { ok: false, reason: "too_fast" };
    }
  }
  return { ok: true };
}
