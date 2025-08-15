export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Submission from '@/models/Submission';
import { requireApiUser } from '@/lib/apiAuth';

// GET one
export async function GET(_req, { params }) {
  await dbConnect();
  await requireApiUser();
  const doc = await Submission.findById(params.id).lean();
  if (!doc) return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
  return NextResponse.json(doc);
}

// DELETE one
export async function DELETE(_req, { params }) {
  await dbConnect();
  await requireApiUser();
  const doc = await Submission.findByIdAndDelete(params.id).lean();
  if (!doc) return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
  return NextResponse.json({ message: 'Submission deleted successfully' });
}
