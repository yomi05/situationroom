// /api/forms/polling/route.js
export const runtime = 'nodejs';

import dbConnect from '@/lib/dbConnect';
import Form from '@/models/Form';

// Return only Active forms where is_pollingform === 1
export async function GET() {
  await dbConnect();
  const forms = await Form.find({
    status: 'Active',
    is_pollingform: 1,
  })
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });

  // You can trim fields if you want to keep payload small
  const out = forms.map(f => ({
    _id: f._id,
    slug: f.slug,
    form_key: f.form_key,
    form_name: f.form_name,
    form_description: f.form_description,
    status: f.status,
    is_pollingform: f.is_pollingform,
    createdAt: f.createdAt,
  }));

  return Response.json(out);
}
