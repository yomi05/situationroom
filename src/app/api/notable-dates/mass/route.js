import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NotableDate from '@/models/NotableDate';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

function toStoreDate(input) {
  if (!input) return '';
  if (/^\d{1,2}\-[A-Za-z]{3}$/.test(input)) return input;
  const d = new Date(`${input}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(input);
  const short = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const [mon, day] = short.split(' ');
  return `${day}-${mon}`;
}

export async function POST(req) {
  const gate = await requirePerm(PERMS.MANAGE_NOTABLE_DATES);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const arr = Array.isArray(body.data) ? body.data : [];
    if (!arr.length) return NextResponse.json({ message: 'No data' }, { status: 400 });

    const docs = arr
      .map((r) => ({
        observation: String(r.observation || '').trim(),
        date: toStoreDate(r.date),
      }))
      .filter((r) => r.observation && r.date);

    if (!docs.length) return NextResponse.json({ message: 'No valid rows' }, { status: 400 });

    await dbConnect();
    const inserted = await NotableDate.insertMany(docs);
    return NextResponse.json({ message: 'Date data uploaded successfully', data: inserted }, { status: 201 });
  } catch (err) {
    console.error('POST /api/notable-dates/mass failed:', err);
    return NextResponse.json({ message: 'Error uploading Date data' }, { status: 500 });
  }
}
