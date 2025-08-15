export const runtime = 'nodejs';

import dbConnect from '@/lib/dbConnect';
import Submission from '@/models/Submission';
import Form from '@/models/Form';
import { requireApiUser } from '@/lib/apiAuth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

/* ---------- helpers ---------- */

function clientIp(headers) {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip') || '';
}

async function findForm(id) {
  // id can be slug OR legacy form_key
  return Form.findOne({ $or: [{ slug: id }, { form_key: id }] }).lean();
}

function makeS3() {
  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT || undefined,
    forcePathStyle: !!S3_ENDPOINT,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });
}

/* ---------- GET: list entries ---------- */

export async function GET(req, { params }) {
  await dbConnect();

  const user = await requireApiUser(); // must be logged in
  const form = await findForm(params.id);
  if (!form) return Response.json([], { status: 200 });

  const url = new URL(req.url);
  const mine = url.searchParams.get('mine') === '1';

  const query = {
    $or: [{ form_id: form.slug }, { form_id: form.form_key }],
  };

  // Only my submissions if ?mine=1 or user is not Admin (adjust to your RBAC)
  if (mine || user.role !== 'Admin') {
    query.created_by = user._id;
  }

  const entries = await Submission.find(query).sort({ createdAt: -1 }).lean();
  return Response.json(entries);
}

/* ---------- POST: create entry (JSON or multipart) ---------- */

export async function POST(req, { params }) {
  await dbConnect();

  const form = await findForm(params.id);
  if (!form) return Response.json({ message: 'Form not found' }, { status: 404 });

  // Try to get current user (allow null if anonymous submissions are OK)
  let userId = null;
  try {
    const user = await requireApiUser();
    userId = user._id;
  } catch {
    // leave userId as null for anonymous submissions
  }

  const ct = req.headers.get('content-type') || '';
  let submission_name = '';
  let submission_value = [];

  // Optional file uploads via S3 (when multipart)
  const uploadedByName = {}; // { originalName: url }
  const s3 = makeS3();
  const bucket = process.env.S3_BUCKET;
  const publicBase = (process.env.S3_PUBLIC_BASE_URL || process.env.S3_ENDPOINT || '').replace(/\/$/, '');

  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData();

    submission_name = (fd.get('submission_name') || '').toString();

    try {
      const raw = (fd.get('field_values') || '[]').toString();
      const arr = JSON.parse(raw);
      submission_value = Array.isArray(arr) ? arr : [];
    } catch {
      submission_value = [];
    }

    // Accept both "file" and "files" fields
    const files = [...fd.getAll('file'), ...fd.getAll('files')].filter(Boolean);

    if (s3 && bucket && files.length) {
      for (const f of files) {
        if (typeof f === 'string') continue;
        const buf = Buffer.from(await f.arrayBuffer());
        const key = `submissions/${uuidv4()}-${encodeURIComponent(f.name)}`;
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buf,
          ContentType: f.type || 'application/octet-stream',
        }));
        const url = publicBase
          ? `${publicBase}/${bucket}/${key}`
          : `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
        uploadedByName[f.name] = url;
      }
    }
  } else {
    // JSON fallback
    const body = await req.json();
    submission_name = body.submission_name || '';
    submission_value = Array.isArray(body.field_values) ? body.field_values : [];
  }

  // Replace fileName → uploaded URL if present
  const normalized = submission_value.map((el) => {
    if (el?.fileName && uploadedByName[el.fileName]) {
      return { field_id: el.field_id, field_value: uploadedByName[el.fileName] };
    }
    return { field_id: el.field_id, field_value: el.field_value };
  });

  const doc = await Submission.create({
    submission_key: uuidv4(),
    item_key: uuidv4(),
    submission_name: submission_name || (normalized[0]?.field_value || ''),
    description: '',
    submission_value: normalized,
    ip: clientIp(req.headers),
    // Store by SLUG going forward (GET still supports legacy key)
    form_id: form.slug,
    created_by: userId, // <-- NEW
  });

  return Response.json({ message: 'Form Submitted', data: doc }, { status: 201 });
}
