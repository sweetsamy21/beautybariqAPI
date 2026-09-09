import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import pagesRouter from "./routes/pages";
import locationsRouter from "./routes/locations";
import testimonialsRouter from "./routes/testimonials";
import settingsRouter from "./routes/settings";
import adminPagesRouter from "./routes/admin/pages";
import adminLocationsRouter from "./routes/admin/locations";
import adminTestimonialsRouter from "./routes/admin/testimonials";
import adminSettingsRouter from "./routes/admin/settings";
import adminUploadsRouter from "./routes/admin/uploads";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://www.beautybariq.com",
  "https://beautybariq.com",
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
app.use("/api/admin/pages", adminPagesRouter);
app.use("/api/admin/locations", adminLocationsRouter);
app.use("/api/admin/testimonials", adminTestimonialsRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/admin/uploads", adminUploadsRouter);

export default app;
