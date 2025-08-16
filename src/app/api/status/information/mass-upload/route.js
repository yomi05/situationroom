import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CategoryInfo from '@/models/category/CategoryInfo';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

export async function POST(req) {
  const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body?.data) ? body.data : [];
  if (!items.length) return NextResponse.json({ message: 'No data provided' }, { status: 400 });

  await dbConnect();
  const inserted = await CategoryInfo.insertMany(items.map(it => ({
    title: it.title || '',
    category: it.category || '',
    state: it.state || '',
    information: it.information || '',
    color: it.color || '#999999',
    image: it.image || { url: null, key: null, mime: null, size: null }
  })));

  return NextResponse.json({ message: 'Category Info uploaded successfully', data: inserted }, { status: 201 });
}
