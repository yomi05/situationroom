export const runtime = 'nodejs';

import dbConnect from '@/lib/dbConnect';
import VoterRegistration from '@/models/VoterRegistration';
import { getServerAuthSession } from '@/lib/auth/getServerAuthSession';
import { hasPerm, PERMS } from '@/lib/rbac';

function toNumberMaybe(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/,/g, '').trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// GET /api/voters
export async function GET() {
  await dbConnect();
  const data = await VoterRegistration.find().sort({ state: 1, year: -1 }).lean();
  return Response.json({ data });
}

// POST /api/voters  (create)
export async function POST(req) {
  await dbConnect();
  const session = await getServerAuthSession();
  const role = session?.user?.role || 'Guest';
  if (!hasPerm(role, PERMS.UPDATE_VOTERS_REGISTRATION)) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  try {
    const body = await req.json();
    const doc = await VoterRegistration.create({
      state:  body.state,
      male:   toNumberMaybe(body.male),
      female: toNumberMaybe(body.female),
      total:  toNumberMaybe(body.total),
      year:   Number(body.year),
    });
    return new Response(JSON.stringify({ data: doc, message: 'Voters data created' }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), { status: 400 });
  }
}
