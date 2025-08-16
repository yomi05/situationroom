import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// ---- Config ----
const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, '');
const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION || 'us-east-1';
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  throw new Error('S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY must be set.');
}

export const s3 = new S3Client({
  region,
  endpoint,             // MinIO endpoint (http/https)
  forcePathStyle: true, // MinIO needs path-style
  credentials: { accessKeyId, secretAccessKey },
});

// ---- Upload policy ----
// Allowed types: images, videos, pdfs
export const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime', // .mp4, .webm, .mov
  'application/pdf',
]);

// Block by extension (executables & installers)
export const BLOCKED_EXT = new Set([
  'exe','msi','bat','sh','ps1','apk','dmg','pkg','deb','rpm','bin','com',
  'cmd','scr','jar','msix','msixbundle','appimage'
]);

// Fallback mime mapping if browser/file.type is empty
const EXT_TO_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', svg: 'image/svg+xml',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', qt: 'video/quicktime',
  pdf: 'application/pdf',
};

function extFromName(name = '') {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function detectMime(file, ext) {
  if (file?.type) return file.type;
  return EXT_TO_MIME[ext] || 'application/octet-stream';
}

function isAllowed(mime, ext) {
  if (BLOCKED_EXT.has(ext)) return false;
  if (ALLOWED_MIME.has(mime)) return true;
  // Allow unknown-but-safe by ext mapping if it lands in EXT_TO_MIME
  return Boolean(EXT_TO_MIME[ext]) && ALLOWED_MIME.has(EXT_TO_MIME[ext]);
}

function buildKey(prefix = 'uploads', ext) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const uuid = randomUUID();
  // Date partitioning helps with large-scale buckets
  return `${prefix}/${yyyy}/${mm}/${dd}/${uuid}.${ext}`;
}

function publicUrlForKey(key) {
  return `${endpoint}/${bucket}/${key}`;
}

/**
 * Upload a File (from Next.js Request.formData()) to MinIO.
 * @param {File} file - from formData.get('file')
 * @param {object} opts
 * @param {string} opts.prefix - folder/prefix (e.g., 'politicalparty', 'incidentreport'); default 'uploads'
 * @param {number} opts.maxBytes - optional max size (default 500MB)
 * @returns {{ key: string, url: string, contentType: string, size: number }}
 */
export async function uploadFileToS3(file, { prefix = 'uploads', maxBytes = 500 * 1024 * 1024 } = {}) {
  if (!file) return null;

  const ext = extFromName(file.name);
  const contentType = detectMime(file, ext);

  if (!isAllowed(contentType, ext)) {
    throw new Error(`File type not allowed: ${contentType || ext}`);
  }

  if (typeof file.size === 'number' && file.size > maxBytes) {
    throw new Error(`File too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB`);
  }

  const key = buildKey(prefix, ext || 'bin');
  const arrayBuffer = await file.arrayBuffer();
  const Body = Buffer.from(arrayBuffer);

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body,
    ContentType: contentType,
    ACL: 'public-read', // if using bucket policy only, remove this line
  }));

  return {
    key,
    url: publicUrlForKey(key),
    contentType,
    size: file.size ?? Body.length,
  };
}

export async function deleteFromS3ByKey(key) {
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
