import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accessKeyId = (process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID)!;
const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)!;
const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
const bucketName = (process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME)!;
const region = process.env.R2_REGION || process.env.AWS_REGION || "auto";

export const s3 = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export async function uploadToS3({
  key,
  file,
  contentType,
}: {
  key: string;
  file: Buffer;
  contentType: string;
}) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );
}

export async function generatePresignedUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3, command, {
    expiresIn: 60 * 10,
  });
}

export async function deleteFromS3(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
}

// Cloudflare R2 Aliases
export const r2 = s3;
export const uploadToR2 = uploadToS3;
export const deleteFromR2 = deleteFromS3;
export const generateR2PresignedUrl = generatePresignedUrl;

