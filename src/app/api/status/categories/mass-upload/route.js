import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/category/Category';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

export async function POST(req) {
  const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const data = Array.isArray(body?.data) ? body.data : [];
  if (!data.length) return NextResponse.json({ message: 'No data provided' }, { status: 400 });

  await dbConnect();
  const inserted = await Category.insertMany(
    data.map(d => ({
      title: d.title,
      description: d.description || '',
      color: d.color || '#999999'
    }))
  );

  return NextResponse.json({ message: 'Category uploaded successfully', data: inserted }, { status: 201 });
}
