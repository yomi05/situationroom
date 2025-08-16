export const runtime = 'nodejs';

import dbConnect from '@/lib/dbConnect';
import PoliticalParty from '@/models/PoliticalParty';
import { uploadFileToS3 } from '@/lib/s3';

// GET /api/parties
export async function GET() {
  await dbConnect();
  const data = await PoliticalParty.find().sort({ pp_name: 1 }).lean();
  return Response.json({ data });
}

// POST /api/parties
export async function POST(req) {
  try {
    await dbConnect();

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ message: 'Use multipart/form-data' }), { status: 400 });
    }

    const form = await req.formData();
    const pp_name = form.get('pp_name')?.toString() || '';
    const pp_acronym = form.get('pp_acronym')?.toString() || '';
    const pp_founded = form.get('pp_founded')?.toString() || '';
    const pp_description = form.get('pp_description')?.toString() || '';
    const imageFile = form.get('pp_image');

    let pp_image = null;
    let pp_image_key = null;

    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      // store under politicalparty/
      const uploaded = await uploadFileToS3(imageFile, { prefix: 'politicalparty' });
      pp_image = uploaded.url;
      pp_image_key = uploaded.key;
    }

    const created = await PoliticalParty.create({
      pp_name, pp_acronym, pp_founded, pp_description,
      pp_image, pp_image_key,
    });

    return new Response(JSON.stringify({ data: created, message: 'Party created' }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ message: e.message }), { status: 500 });
  }
}
