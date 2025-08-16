import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CategoryInfo from '@/models/category/CategoryInfo';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';
import { uploadBuffer } from '@/lib/s3';

const FOLDER = 'statusinfo';

export async function GET() {
  try {
    await dbConnect();
    const data = await CategoryInfo.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/status/information failed:', err);
    return NextResponse.json({ message: 'Failed to load status information' }, { status: 500 });
  }
}

// multipart/form-data create (with optional image)
export async function POST(req) {
  const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const form = await req.formData();
    const payload = Object.fromEntries(form.entries());
    const file = form.get('image');

    let image = null;
    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'bin';
      const key = `${FOLDER}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await uploadBuffer({ buffer: bytes, contentType: file.type, key });
      image = { url, key, mime: file.type, size: bytes.length };
    }

    await dbConnect();
    const created = await CategoryInfo.create({
      title: payload.title || '',
      category: payload.category || '',
      state: payload.state || '',
      information: payload.information || '',
      color: payload.color || '#999999',
      ...(image ? { image } : {}),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/status/information failed:', err);
    return NextResponse.json({ message: 'Failed to create info' }, { status: 500 });
  }
}
