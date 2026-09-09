import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAdmin } from "../../lib/auth";
import { uploadAssetImage } from "../../lib/s3-assets";
import { errStatus } from "../../lib/errors";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
    }
    cb(null, true);
  },
});

function handleUpload(req: Request, res: Response, next: (err?: unknown) => void) {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err instanceof Error ? err.message : "Upload failed" });
    next();
  });
}

// Generic asset upload for page-content hero images / location photos.
// Requires a real S3 bucket + AWS credentials (see lib/s3-assets.ts) —
// until configured, this route returns a clear 500 rather than silently
// pretending to succeed.
router.post("/", handleUpload, async (req: Request, res: Response) => {
  try {
    requireAdmin(req);
    if (!req.file) return res.status(400).json({ success: false, error: "No image file provided" });

    const { url, s3Key } = await uploadAssetImage({
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      prefix: "pages",
    });

    return res.status(201).json({ success: true, data: { url, s3Key } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/admin/uploads]", err);
    return res.status(errStatus(msg)).json({ success: false, error: msg });
  }
});

export default router;
