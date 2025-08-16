import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SenateElection from '@/models/elections/SenateElection';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

export async function GET(_req, { params }) {
  try {
    await dbConnect();
    const one = await SenateElection.findById(params.id).lean();
    if (!one) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(one);
  } catch (e) {
    console.error('GET one senatorial failed:', e);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const { state, district, year, party, candidate, votes } = body || {};

    await dbConnect();
    const updated = await SenateElection.findByIdAndUpdate(
      params.id,
      {
        ...(state !== undefined && { state }),
        ...(district !== undefined && { district }),
        ...(year !== undefined && { year: Number(year) }),
        ...(party !== undefined && { party }),
        ...(candidate !== undefined && { candidate }),
        ...(votes !== undefined && { votes }),
      },
      { new: true }
    );
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PUT senatorial failed:', e);
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    await dbConnect();
    const deleted = await SenateElection.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (e) {
    console.error('DELETE senatorial failed:', e);
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
