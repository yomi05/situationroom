import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SenateElection from '@/models/elections/SenateElection';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

export async function POST(req) {
  const gate = await requirePerm(PERMS.UPDATE_PAST_ELECTIONS);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const rows = Array.isArray(body?.data) ? body.data : [];
    if (!rows.length) return NextResponse.json({ message: 'No rows to upload' }, { status: 400 });

    const docs = rows
      .map(r => ({
        state: String(r.state || '').trim(),
        district: String(r.district || '').trim(),
        year: Number(r.year),
        party: String(r.party || '').trim(),
        candidate: String(r.candidate || '').trim(),
        votes: r.votes ?? ''
      }))
      .filter(d => d.state && d.district && d.year && d.party && d.candidate);

    if (!docs.length) return NextResponse.json({ message: 'No valid rows' }, { status: 400 });

    await dbConnect();
    const inserted = await SenateElection.insertMany(docs, { ordered: false });
    return NextResponse.json(
      { message: `Uploaded ${inserted.length} rows`, data: inserted },
      { status: 201 }
    );
  } catch (e) {
    console.error('Mass upload senatorial failed:', e);
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}
