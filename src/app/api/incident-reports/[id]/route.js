export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import IncidentReport from '@/models/IncidentReport';
import { requireApiUser } from '@/lib/apiAuth';

// GET /api/incident-reports/:id
export async function GET(_req, { params }) {
  await dbConnect();
  const doc = await IncidentReport.findById(params.id).lean();
  if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: doc });
}

// PATCH /api/incident-reports/:id  (JSON body)
export async function PATCH(req, { params }) {
  await dbConnect();
  await requireApiUser();

  const body = await req.json();
  const update = {};
  const fields = ['name','gender','email','phone','description','state','lga','ward','pollingunit','uploads'];
  for (const k of fields) if (k in body) update[k] = body[k];

  const doc = await IncidentReport.findByIdAndUpdate(params.id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: doc });
}

// DELETE /api/incident-reports/:id
export async function DELETE(_req, { params }) {
  await dbConnect();
  await requireApiUser();

  const doc = await IncidentReport.findByIdAndDelete(params.id).lean();
  if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  // Optionally: delete S3 objects in doc.uploads here if you store keys
  return NextResponse.json({ message: 'Deleted' });
}
