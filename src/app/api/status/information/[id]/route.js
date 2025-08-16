import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CategoryInfo from '@/models/category/CategoryInfo';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';
import { uploadBuffer, deleteKey } from '@/lib/s3';

const FOLDER = 'statusinfo';

export async function PUT(req, { params }) {
  const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    await dbConnect();
    const doc = await CategoryInfo.findById(params.id);
    if (!doc) return NextResponse.json({ message: 'Info not found' }, { status: 404 });

    const ct = req.headers.get('content-type') || '';
    // multipart update (can include new image)
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('image');

      const fields = {};
      ['title', 'category', 'state', 'information', 'color'].forEach((k) => {
        if (form.has(k)) fields[k] = form.get(k);
      });

      let image = doc.image;
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        if (image?.key) await deleteKey(image.key).catch(() => {});
        const bytes = Buffer.from(await file.arrayBuffer());
        const ext = (file.name || '').split('.').pop()?.toLowerCase() || 'bin';
        const key = `${FOLDER}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await uploadBuffer({ buffer: bytes, contentType: file.type, key });
        image = { url, key, mime: file.type, size: bytes.length };
      }

      Object.assign(doc, fields, { image });
      await doc.save();
      return NextResponse.json(doc);
    }

    // JSON update (no file)
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    Object.assign(doc, body);
    await doc.save();
    return NextResponse.json(doc);
  } catch (err) {
    console.error('PUT /api/status/information/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to update info' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    await dbConnect();
    const doc = await CategoryInfo.findById(params.id);
    if (!doc) return NextResponse.json({ message: 'Info not found' }, { status: 404 });

    if (doc.image?.key) {
      await deleteKey(doc.image.key).catch(() => {});
    }
    await doc.deleteOne();
    return NextResponse.json({ message: 'Info deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/status/information/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to delete info' }, { status: 500 });
  }
}
