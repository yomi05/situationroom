import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import GovernorshipElection from '@/models/elections/GovernorshipElection';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

export async function GET(_req, { params }) {
  try {
    await dbConnect();
    const one = await GovernorshipElection.findById(params.id).lean();
    if (!one) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(one);
  } catch (e) {
    console.error('GET one governorship failed:', e);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const { state, year, party, candidate, deputy, votes } = body || {};

    await dbConnect();
    const updated = await GovernorshipElection.findByIdAndUpdate(
      params.id,
      {
        ...(state !== undefined && { state }),
        ...(year !== undefined && { year: Number(year) }),
        ...(party !== undefined && { party }),
        ...(candidate !== undefined && { candidate }),
        ...(deputy !== undefined && { deputy }),
        ...(votes !== undefined && { votes }),
      },
      { new: true }
    );
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PUT governorship failed:', e);
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    await dbConnect();
    const deleted = await GovernorshipElection.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (e) {
    console.error('DELETE governorship failed:', e);
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
