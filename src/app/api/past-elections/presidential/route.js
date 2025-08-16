import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PresidentialElection from '@/models/elections/PresidentialElection';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';
import { v4 as uuidv4 } from 'uuid';

// GET all (view permission)
export async function GET() {
  try {
    await dbConnect();
    const data = await PresidentialElection.find().sort({ year: -1, createdAt: -1 }).lean();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/past-elections/presidential failed:', err);
    return NextResponse.json({ message: 'Failed to load elections' }, { status: 500 });
  }
}

// CREATE one (update permission)
export async function POST(req) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const {
      position = 'President',
      year,
      party,
      candidate,
      votes,
      percentage,
    } = body || {};

    if (!year || !party || !candidate || percentage === undefined) {
      return NextResponse.json(
        { message: 'year, party, candidate, percentage are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const created = await PresidentialElection.create({
      past_election_key: uuidv4(),
      position,
      year: Number(year),
      party,
      candidate,
      votes,
      percentage: Number(percentage),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/past-elections/presidential failed:', err);
    return NextResponse.json({ message: 'Failed to create election' }, { status: 500 });
  }
}
