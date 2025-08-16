import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PresidentialElection from '@/models/elections/PresidentialElection';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const arr = Array.isArray(body?.data) ? body.data : [];
    if (!arr.length) {
      return NextResponse.json({ message: 'data[] required' }, { status: 400 });
    }

    await dbConnect();
    const docs = arr.map((e) => ({
      past_election_key: e.past_election_key || uuidv4(),
      position: e.position || 'President',
      year: Number(e.year),
      party: e.party,
      candidate: e.candidate,
      votes: e.votes,
      percentage: Number(e.percentage),
    }));

    const inserted = await PresidentialElection.insertMany(docs);
    return NextResponse.json({ message: 'Uploaded', data: inserted }, { status: 201 });
  } catch (err) {
    console.error('POST /api/past-elections/presidential/mass-upload failed:', err);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}
2