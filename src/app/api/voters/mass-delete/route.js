export const runtime = 'nodejs';

import dbConnect from '@/lib/dbConnect';
import VoterRegistration from '@/models/VoterRegistration';
import { getServerAuthSession } from '@/lib/auth/getServerAuthSession';
import { hasPerm, PERMS } from '@/lib/rbac';

export async function DELETE(req) {
  await dbConnect();
  const session = await getServerAuthSession();
  const role = session?.user?.role || 'Guest';
  if (!hasPerm(role, PERMS.UPDATE_VOTERS_REGISTRATION)) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ message: 'No ids provided' }), { status: 400 });
    }
    const result = await VoterRegistration.deleteMany({ _id: { $in: ids } });
    return Response.json({ message: 'Deleted selected records', result });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), { status: 400 });
  }
}
