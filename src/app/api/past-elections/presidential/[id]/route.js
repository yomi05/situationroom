import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PresidentialElection from '@/models/elections/PresidentialElection';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

// GET one
export async function GET(_req, { params }) {
  try {
    await dbConnect();
    const doc = await PresidentialElection.findById(params.id).lean();
    if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    console.error('GET /api/past-elections/presidential/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to load' }, { status: 500 });
  }
}

// UPDATE one (update permission)
export async function PUT(req, { params }) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const {
      position,
      year,
      party,
      candidate,
      votes,
      percentage,
    } = body || {};

    await dbConnect();
    const updated = await PresidentialElection.findByIdAndUpdate(
      params.id,
      {
        ...(position !== undefined && { position }),
        ...(year !== undefined && { year: Number(year) }),
        ...(party !== undefined && { party }),
        ...(candidate !== undefined && { candidate }),
        ...(votes !== undefined && { votes }),
        ...(percentage !== undefined && { percentage: Number(percentage) }),
      },
      { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/past-elections/presidential/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to update' }, { status: 500 });
  }
}

// DELETE one (update permission)
export async function DELETE(_req, { params }) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    await dbConnect();
    const deleted = await PresidentialElection.findByIdAndDelete(params.id).lean();
    if (!deleted) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/past-elections/presidential/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to delete' }, { status: 500 });
  }
}
