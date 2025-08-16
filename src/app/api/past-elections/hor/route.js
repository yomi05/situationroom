import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import HorElection from '@/models/elections/HorElection';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

export async function GET() {
  try {
    await dbConnect();
    const data = await HorElection
      .find({})
      .sort({ year: -1, state: 1, constituency: 1, votes: -1 })
      .lean();
    return NextResponse.json({ data });
  } catch (e) {
    console.error('GET /api/past-elections/hor failed:', e);
    return NextResponse.json({ message: 'Failed to load elections' }, { status: 500 });
  }
}

export async function POST(req) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const { state, year, party, candidate, constituency, votes = '' } = body || {};

    if (!state || !year || !party || !candidate || !constituency) {
      return NextResponse.json(
        { message: 'state, year, party, candidate, constituency are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const created = await HorElection.create({
      state,
      year: Number(year),
      party,
      candidate,
      constituency,
      votes
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST /api/past-elections/hor failed:', e);
    return NextResponse.json({ message: 'Failed to create record' }, { status: 500 });
  }
}
