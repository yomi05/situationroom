// /api/forms/[id]/route.js
export const runtime = 'nodejs';

import dbConnect from '@/lib/dbConnect';
import Form from '@/models/Form';
import { requireApiUser } from '@/lib/apiAuth';

function looksLikeObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Resolve by slug → form_key → _id (in that order)
function buildFindQuery(id) {
  const or = [{ slug: id }, { form_key: id }];
  if (looksLikeObjectId(id)) or.push({ _id: id });
  return { $or: or };
}

const RETURN_PROJECTION = undefined;         // e.g. { __v: 0 } if you want
const LEAN_OPTIONS = { virtuals: true };

export async function GET(_req, { params }) {
  await dbConnect();
  const query = buildFindQuery(params.id);
  const doc = await Form.findOne(query).select(RETURN_PROJECTION).lean(LEAN_OPTIONS);
  if (!doc) return Response.json({ message: 'Form not found' }, { status: 404 });
  return Response.json(doc);
}

export async function PATCH(req, { params }) {
  await dbConnect();
  const user = await requireApiUser(); // throws if unauthorized

  const body = await req.json();

  // Whitelist updatable fields
  const allowed = [
    'form_name',
    'form_description',
    'status',
    'fields',
    'is_editable',
    'is_template',
    'is_loggedin',
    'is_pollingform', // ✅ include the polling flag
  ];

  // Optionally allow user_id changes for admins only
  if (user?.role === 'Admin' && 'user_id' in body) {
    allowed.push('user_id');
  }

  const update = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }

  const query = buildFindQuery(params.id);

  const updated = await Form.findOneAndUpdate(
    query,
    { $set: update },
    { new: true, runValidators: true, context: 'query' }
  ).select(RETURN_PROJECTION).lean(LEAN_OPTIONS);

  if (!updated) return Response.json({ message: 'Form not found' }, { status: 404 });
  return Response.json({ message: 'Form Updated', data: updated });
}

export async function DELETE(_req, { params }) {
  await dbConnect();
  await requireApiUser();

  const query = buildFindQuery(params.id);
  const deleted = await Form.findOneAndDelete(query).lean(LEAN_OPTIONS);
  if (!deleted) return Response.json({ message: 'Form not found' }, { status: 404 });

  return Response.json({ message: 'Form deleted successfully' });
}
