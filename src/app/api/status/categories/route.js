import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/category/Category';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

// GET all categories
export async function GET() {
  try {
    await dbConnect();
    const data = await Category.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/status/categories failed:', err);
    return NextResponse.json({ message: 'Failed to load categories' }, { status: 500 });
  }
}

// CREATE a category (requires manage)
export async function POST(req) {
  const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const { title, description = '', color = '#999999' } = body || {};
    if (!title) return NextResponse.json({ message: 'Title is required' }, { status: 400 });

    await dbConnect();
    const created = await Category.create({ title, description, color });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/status/categories failed:', err);
    return NextResponse.json({ message: 'Failed to create category' }, { status: 500 });
  }
}
