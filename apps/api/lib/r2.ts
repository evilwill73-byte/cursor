import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function getPublicVideoUrl(appSlug: string, hlsPath: string | null) {
  if (!hlsPath) return null;
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/${appSlug}/${hlsPath}`;
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string | null> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!client || !bucket) return null;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 900 });
}

export function buildRawVideoKey(
  appSlug: string,
  videoId: string,
  filename: string
) {
  const ext = filename.split(".").pop() ?? "mp4";
  return `${appSlug}/videos/${videoId}/raw/source.${ext}`;
}

export function buildHlsPath(videoId: string) {
  return `videos/${videoId}/hls/master.m3u8`;
}
