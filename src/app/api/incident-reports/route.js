export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/dbConnect';
import IncidentReport from '@/models/IncidentReport';
import { requireApiUser } from '@/lib/apiAuth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function makeS3() {
  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    forcePathStyle: true, // MinIO friendly; safe for AWS too
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });
}

// GET /api/incident-reports?page=1&limit=50&state=&lga=&ward=&q=
export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);

  const query = {};
  if (searchParams.get('state')) query.state = searchParams.get('state');
  if (searchParams.get('lga')) query.lga = searchParams.get('lga');
  if (searchParams.get('ward')) query.ward = searchParams.get('ward');

  const q = (searchParams.get('q') || '').trim();
  if (q) {
    query.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') },
      { pollingunit: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    IncidentReport.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    IncidentReport.countDocuments(query),
  ]);

  return NextResponse.json({
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// POST /api/incident-reports (multipart/form-data)
export async function POST(req) {
  await dbConnect();

  // Public: allow unauthenticated citizens to submit reports.
  // If you prefer auth-only, uncomment:
  // await requireApiUser();

  const form = await req.formData();

  const name = (form.get('name') || '').toString().trim();
  const gender = (form.get('gender') || '').toString().trim();
  const email = (form.get('email') || '').toString().trim().toLowerCase();
  const phone = (form.get('phone') || '').toString().trim();
  const description = (form.get('description') || '').toString(); // HTML or text

  const state = (form.get('state') || '').toString().trim();
  const lga = (form.get('lga') || '').toString().trim();
  const ward = (form.get('ward') || '').toString().trim();
  const pollingunit = (form.get('pollingunit') || form.get('pollingUnit') || '').toString().trim();

  if (!name || !gender || !email || !phone || !description || !state || !lga || !ward || !pollingunit) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  // files may be named 'uploads' OR 'upload' (compat)
  const fileEntries = [
    ...form.getAll('uploads'),
    ...form.getAll('upload'),
  ].filter(Boolean);

  const s3 = makeS3();
  const bucket = process.env.S3_BUCKET;
  const uploaded = [];

  for (const f of fileEntries) {
    if (typeof f === 'string') continue; // skip stray strings
    if (!s3 || !bucket) break; // if S3 missing, skip upload

    const arrayBuf = await f.arrayBuffer();
    const key = `incident-reports/${uuidv4()}-${encodeURIComponent(f.name)}`;

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(arrayBuf),
      ContentType: f.type || 'application/octet-stream',
      // ACL: 'public-read', // set if your bucket policy requires it
    }));

    // public URL (adjust for your endpoint/bucket policy)
    const base = process.env.S3_PUBLIC_BASE_URL || process.env.S3_ENDPOINT;
    const url = `${base.replace(/\/$/, '')}/${bucket}/${key}`;
    uploaded.push(url);
  }

  const doc = await IncidentReport.create({
    incident_report_key: uuidv4(),
    name, gender, email, phone,
    description,
    uploads: uploaded, // [] if S3 not configured
    state, lga, ward, pollingunit,
  });

  return NextResponse.json({ message: 'Report created successfully', data: doc }, { status: 201 });
}
