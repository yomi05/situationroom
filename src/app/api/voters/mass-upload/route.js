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

export async function POST(req) {
  await dbConnect();
  const session = await getServerAuthSession();
  const role = session?.user?.role || 'Guest';
  if (!hasPerm(role, PERMS.UPDATE_VOTERS_REGISTRATION)) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  try {
    const { voter_registrations } = await req.json();
    if (!Array.isArray(voter_registrations) || voter_registrations.length === 0) {
      return new Response(JSON.stringify({ message: 'No records provided' }), { status: 400 });
    }

    // Upsert by (state, year) so CSV re-uploads update existing rows
    const ops = voter_registrations.map((r) => ({
      updateOne: {
        filter: { state: String(r.state).trim(), year: Number(r.year) },
        update: {
          $set: {
            state:  String(r.state).trim(),
            male:   toNumberMaybe(r.male),
            female: toNumberMaybe(r.female),
            total:  toNumberMaybe(r.total),
            year:   Number(r.year),
          }
        },
        upsert: true,
      }
    }));

    const result = await VoterRegistration.bulkWrite(ops, { ordered: false });
    return Response.json({ message: 'Mass upload complete', result });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), { status: 400 });
  }
}
