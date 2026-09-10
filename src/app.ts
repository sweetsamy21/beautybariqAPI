import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import pagesRouter from "./routes/pages";
import locationsRouter from "./routes/locations";
import testimonialsRouter from "./routes/testimonials";
import settingsRouter from "./routes/settings";
import servicesRouter from "./routes/services";
import leadsRouter from "./routes/leads";
import adminPagesRouter from "./routes/admin/pages";
import adminLocationsRouter from "./routes/admin/locations";
import adminTestimonialsRouter from "./routes/admin/testimonials";
import adminSettingsRouter from "./routes/admin/settings";
import adminUploadsRouter from "./routes/admin/uploads";
import adminServicesRouter from "./routes/admin/services";
import adminLeadsRouter from "./routes/admin/leads";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://www.beautybariq.com",
  "https://beautybariq.com",
  // Amplify's default domain for the dev/preview deployment (no custom
  // domain attached yet) — see beautybariqUI's amplify app "main" branch.
  "https://main.d31dutwtlsmxvx.amplifyapp.com",
];

const app = express();

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/pages", pagesRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/admin/pages", adminPagesRouter);
app.use("/api/admin/locations", adminLocationsRouter);
app.use("/api/admin/testimonials", adminTestimonialsRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/admin/uploads", adminUploadsRouter);
app.use("/api/admin/services", adminServicesRouter);
app.use("/api/admin/leads", adminLeadsRouter);

export default app;
