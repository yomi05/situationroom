// /api/forms/route.js
export const runtime = 'nodejs';

import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/dbConnect';
import Form from '@/models/Form';
import { requireApiUser } from '@/lib/apiAuth';

export async function GET() {
  await dbConnect();
  const forms = await Form.find().sort({ createdAt: -1 }).lean({ virtuals: true });
  return Response.json(forms);
}

export async function POST(req) {
  await dbConnect();

  try {
    const user = await requireApiUser(); // must return {_id, ...}

    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return Response.json({ message: 'Content-Type must be application/json' }, { status: 415 });
    }

    const body = await req.json();
    const form_name = (body?.form_name || '').trim();
    const form_description = body?.form_description || '';
    const is_pollingform = Number(body?.is_pollingform) === 1 ? 1 : 0; // accept & normalize

    if (!form_name) {
      return Response.json({ message: 'form_name is required' }, { status: 400 });
    }

    const form = await Form.create({
      form_id: uuidv4(),
      form_key: uuidv4(),
      form_name,
      form_description,
      status: 'Active',
      is_pollingform,       // ✅ persisted
      user_id: user._id,    // ✅ actual ObjectId
      fields: [],
    });

    return Response.json({ message: 'Form Created', data: form }, { status: 201 });
  } catch (err) {
    const details = err?.errors
      ? Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v?.message]))
      : undefined;

    const status = err?.statusCode === 401 || err?.status === 401 ? 401 : 400;
    return Response.json(
      { message: 'Create failed', error: err?.message || 'Validation error', details },
      { status }
    );
  }
}
