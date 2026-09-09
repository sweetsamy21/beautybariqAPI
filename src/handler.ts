// Harmless no-op under Lambda (no .env in the deployed bundle; dotenv
// never overwrites an already-set var, so AWS's injected env vars win) —
// see src/index.ts's identical guard for the full rationale.
import "dotenv/config";
import serverless from "serverless-http";
import app from "./app";

export const handler = serverless(app);
