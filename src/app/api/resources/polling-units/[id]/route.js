export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PollingUnit from '@/models/PollingUnit';
import { requireApiUser } from '@/lib/apiAuth';

export async function GET(_req, { params }) {
  await dbConnect();
  const doc = await PollingUnit.findById(params.id).lean();
  if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: doc });
}

export async function PATCH(req, { params }) {
  await dbConnect();
  await requireApiUser();

  const body = await req.json();
  const update = {};
  ['state', 'lga', 'registration_area', 'polling_unit'].forEach((k) => {
    if (k in body) update[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
  });

  const doc = await PollingUnit.findByIdAndUpdate(params.id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: doc });
}

export async function DELETE(_req, { params }) {
  await dbConnect();
  await requireApiUser();

  const doc = await PollingUnit.findByIdAndDelete(params.id).lean();
  if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ message: 'Polling unit deleted successfully' });
}
