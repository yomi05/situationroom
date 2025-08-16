export const runtime = 'nodejs';

import dbConnect from '@/lib/dbConnect';
import PoliticalParty from '@/models/PoliticalParty';
import { uploadFileToS3, deleteFromS3ByKey } from '@/lib/s3';

// GET /api/parties/:id
export async function GET(_req, { params }) {
  await dbConnect();
  const item = await PoliticalParty.findById(params.id);
  if (!item) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
  return Response.json({ data: item });
}

// PUT /api/parties/:id
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ message: 'Use multipart/form-data' }), { status: 400 });
    }

    const existing = await PoliticalParty.findById(params.id);
    if (!existing) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });

    const form = await req.formData();
    const update = {
      pp_name:        form.get('pp_name')?.toString() || existing.pp_name,
      pp_acronym:     form.get('pp_acronym')?.toString() || existing.pp_acronym,
      pp_founded:     form.get('pp_founded')?.toString() || existing.pp_founded,
      pp_description: form.get('pp_description')?.toString() || existing.pp_description,
      pp_image:       existing.pp_image,
      pp_image_key:   existing.pp_image_key,
    };

    const imageFile = form.get('pp_image');
    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      // upload new
      const uploaded = await uploadFileToS3(imageFile, { prefix: 'politicalparty' });
      update.pp_image = uploaded.url;
      update.pp_image_key = uploaded.key;

      // delete old from S3 (if any)
      if (existing.pp_image_key) {
        try { await deleteFromS3ByKey(existing.pp_image_key); } catch {}
      }
    }

    const updated = await PoliticalParty.findByIdAndUpdate(params.id, update, { new: true });
    return Response.json({ data: updated, message: 'Party updated' });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), { status: 500 });
  }
}

// DELETE /api/parties/:id
export async function DELETE(_req, { params }) {
  await dbConnect();
  const existing = await PoliticalParty.findById(params.id);
  if (!existing) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });

  // First delete object from S3 (if tracked)
  if (existing.pp_image_key) {
    try { await deleteFromS3ByKey(existing.pp_image_key); } catch {}
  }

  await existing.deleteOne();
  return Response.json({ message: 'Party deleted' });
}
