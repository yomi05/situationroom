import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SenateElection from '@/models/elections/SenateElection';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

export async function GET() {
  try {
    await dbConnect();
    const data = await SenateElection
      .find({})
      .sort({ year: -1, state: 1, district: 1, votes: -1 })
      .lean();
    return NextResponse.json({ data });
  } catch (e) {
    console.error('GET senatorial failed:', e);
    return NextResponse.json({ message: 'Failed to load elections' }, { status: 500 });
  }
}

export async function POST(req) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const { state, district, year, party, candidate, votes = '' } = body || {};
    if (!state || !district || !year || !party || !candidate) {
      return NextResponse.json(
        { message: 'state, district, year, party, candidate are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const created = await SenateElection.create({
      state,
      district,
      year: Number(year),
      party,
      candidate,
      votes
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST senatorial failed:', e);
    return NextResponse.json({ message: 'Failed to create record' }, { status: 500 });
  }
}
