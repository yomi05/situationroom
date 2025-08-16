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
  const short = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Jan 1"
  const [mon, day] = short.split(' ');
  return `${day}-${mon}`;
}

export async function PUT(req, { params }) {
  const gate = await requirePerm(PERMS.MANAGE_NOTABLE_DATES);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const update = {};
    if (body.observation !== undefined) update.observation = body.observation;
    if (body.date !== undefined) update.date = toStoreDate(body.date);

    await dbConnect();
    const updated = await NotableDate.findByIdAndUpdate(params.id, update, { new: true });
    if (!updated) return NextResponse.json({ message: 'Date not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/notable-dates/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to update date' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const gate = await requirePerm(PERMS.MANAGE_NOTABLE_DATES);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    await dbConnect();
    const deleted = await NotableDate.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ message: 'Date not found' }, { status: 404 });
    return NextResponse.json({ message: 'Date deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/notable-dates/[id] failed:', err);
    return NextResponse.json({ message: 'Failed to delete date' }, { status: 500 });
  }
}
