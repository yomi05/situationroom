import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NotableDate from '@/models/NotableDate';
import { requirePerm } from '@/lib/auth/requirePerm';
import { PERMS } from '@/lib/rbac';

// Convert "YYYY-MM-DD" -> "d-MMM" (e.g., "2025-08-13" -> "13-Aug")
// Pass-through if already "d-MMM".
function toStoreDate(input) {
  if (!input) return '';
  if (/^\d{1,2}\-[A-Za-z]{3}$/.test(input)) return input;

  const d = new Date(`${input}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(input);

  const short = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Aug 13"
  const [mon, day] = short.split(' ');
  return `${day}-${mon}`;
}

// Compute the next occurrence timestamp for a "d-MMM" date,
// wrapping strictly to next year if the date is today or has passed.
function nextOccurrenceTs(dMon) {
  if (!dMon || typeof dMon !== 'string' || !dMon.includes('-')) {
    return Number.POSITIVE_INFINITY;
  }
  const [dStr, monAbbr] = dMon.split('-');
  const day = Number(dStr);
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const mIdx = monthMap[monAbbr];
  if (!Number.isFinite(day) || mIdx === undefined) {
    return Number.POSITIVE_INFINITY;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // start of today
  let target = new Date(now.getFullYear(), mIdx, day); // this year at 00:00

  // Strict 1-year window: if today or earlier, move to next year
  if (target <= today) {
    target = new Date(now.getFullYear() + 1, mIdx, day);
  }
  return target.getTime();
}

// GET — return all, ordered by next upcoming date within a 1-year window
export async function GET() {
  try {
    await dbConnect();
    const data = await NotableDate.find().lean();

    const sorted = data.sort((a, b) => {
      const ta = nextOccurrenceTs(a?.date);
      const tb = nextOccurrenceTs(b?.date);
      if (ta !== tb) return ta - tb;
      return String(a?.observation || '').localeCompare(String(b?.observation || '')); // stable tie-breaker
    });

    return NextResponse.json({ data: sorted });
  } catch (err) {
    console.error('GET /api/notable-dates failed:', err);
    return NextResponse.json({ message: 'Failed to load dates' }, { status: 500 });
  }
}

// POST — create (requires MANAGE_NOTABLE_DATES)
export async function POST(req) {
  const gate = await requirePerm(PERMS.MANAGE_NOTABLE_DATES);
  if (!gate.ok) return NextResponse.json(gate.json, { status: gate.status });

  try {
    const text = await req.text();
    let body = {};
    if (text) {
      try { body = JSON.parse(text); } catch { body = {}; }
    }
    const { observation = '', date = '' } = body || {};
    if (!observation || !date) {
      return NextResponse.json({ message: 'date and observation are required' }, { status: 400 });
    }

    await dbConnect();
    const created = await NotableDate.create({
      observation,
      date: toStoreDate(date),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/notable-dates failed:', err);
    return NextResponse.json({ message: 'Failed to create date' }, { status: 500 });
  }
}
