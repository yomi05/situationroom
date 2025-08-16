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

// GET /api/voters/:id
export async function GET(_req, { params }) {
  await dbConnect();
  const item = await VoterRegistration.findById(params.id);
  if (!item) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
  return Response.json({ data: item });
}

// PUT /api/voters/:id
export async function PUT(req, { params }) {
  await dbConnect();
  const session = await getServerAuthSession();
  const role = session?.user?.role || 'Guest';
  if (!hasPerm(role, PERMS.UPDATE_VOTERS_REGISTRATION)) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  try {
    const body = await req.json();
    const update = {
      state:  body.state,
      male:   toNumberMaybe(body.male),
      female: toNumberMaybe(body.female),
      total:  toNumberMaybe(body.total),
      year:   Number(body.year),
    };
    const updated = await VoterRegistration.findByIdAndUpdate(params.id, update, { new: true });
    if (!updated) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
    return Response.json({ data: updated, message: 'Voters data updated' });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), { status: 400 });
  }
}

// DELETE /api/voters/:id
export async function DELETE(_req, { params }) {
  await dbConnect();
  const session = await getServerAuthSession();
  const role = session?.user?.role || 'Guest';
  if (!hasPerm(role, PERMS.UPDATE_VOTERS_REGISTRATION)) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  const existing = await VoterRegistration.findById(params.id);
  if (!existing) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });

  await existing.deleteOne();
  return Response.json({ message: 'Voters data deleted' });
}
