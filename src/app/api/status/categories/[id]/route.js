import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/category/Category';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

export async function PUT(req, { params }) {
  const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const { title, description, color } = body || {};

    await dbConnect();
    const updated = await Category.findByIdAndUpdate(
      params.id,
      {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
      },
      { new: true }
    );
    if (!updated) return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/status/categories/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const gate = await requirePerm(PERMS.MANAGE_STATUS_INFORMATION);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    await dbConnect();
    const deleted = await Category.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/status/categories/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to delete category' }, { status: 500 });
  }
}
