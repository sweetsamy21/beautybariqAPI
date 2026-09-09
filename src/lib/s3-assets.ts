import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Requires a real S3 bucket + AWS credentials to actually work — set
// S3_BUCKET_ASSETS/AWS_REGION (and standard AWS credential env vars, or an
// attached IAM role in production) before using the uploads route. Until
// then, admin page/location edits still work fine using plain image URL
// fields; only the upload button needs this.
const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });
const ASSETS_BUCKET = process.env.S3_BUCKET_ASSETS ?? "beautybariq-media-prod";
const REGION = process.env.AWS_REGION ?? "us-east-1";

export async function uploadAssetImage(opts: {
  buffer: Buffer;
  contentType: string;
  prefix: string;
}): Promise<{ url: string; s3Key: string }> {
  const ext = opts.contentType === "image/png" ? "png" : opts.contentType === "image/webp" ? "webp" : "jpg";
  const s3Key = `${opts.prefix}/${randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: ASSETS_BUCKET,
    Key: s3Key,
    Body: opts.buffer,
    ContentType: opts.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));

  return { url: `https://${ASSETS_BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`, s3Key };
}

export async function deleteAssetImage(s3Key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: ASSETS_BUCKET, Key: s3Key }));
}
