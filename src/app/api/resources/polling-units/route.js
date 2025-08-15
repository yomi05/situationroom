export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PollingUnit from '@/models/PollingUnit';
import { requireApiUser } from '@/lib/apiAuth';

// GET supports:
// ?distinct=state                      -> list of states
// ?by=state&value=Kano                 -> list of LGAs in state
// ?by=lga&value=Nassarawa              -> list of wards in LGA
// ?by=registration_area&value=XYZ Ward -> list of units (docs) in ward
// (default) list with optional filters: state,lga,registration_area,page,limit
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const distinct = searchParams.get('distinct');
  if (distinct === 'state') {
    const states = (await PollingUnit.distinct('state')).filter(Boolean).sort();
    return NextResponse.json({ data: states });
  }

  const by = searchParams.get('by');
  const value = searchParams.get('value') ? decodeURIComponent(searchParams.get('value')) : null;

  if (by === 'state' && value) {
    const lgas = (await PollingUnit.distinct('lga', { state: value })).filter(Boolean).sort();
    return NextResponse.json({ data: lgas });
  }
  if (by === 'lga' && value) {
    const wards = (await PollingUnit.distinct('registration_area', { lga: value })).filter(Boolean).sort();
    return NextResponse.json({ data: wards });
  }
  if (by === 'registration_area' && value) {
    const units = await PollingUnit.find({ registration_area: value })
      .sort({ polling_unit: 1 })
      .lean();
    return NextResponse.json({ data: units });
  }

  // default list (paginated)
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);

  const query = {};
  if (searchParams.get('state')) query.state = searchParams.get('state');
  if (searchParams.get('lga')) query.lga = searchParams.get('lga');
  if (searchParams.get('registration_area')) query.registration_area = searchParams.get('registration_area');

  const [items, total] = await Promise.all([
    PollingUnit.find(query)
      .sort({ state: 1, lga: 1, registration_area: 1, polling_unit: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PollingUnit.countDocuments(query),
  ]);

  return NextResponse.json({
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req) {
  await dbConnect();
  await requireApiUser();

  const body = await req.json();
  const payload = {
    state: body?.state?.trim(),
    lga: body?.lga?.trim(),
    registration_area: body?.registration_area?.trim(),
    polling_unit: body?.polling_unit?.trim(),
  };

  if (!payload.state || !payload.lga || !payload.registration_area || !payload.polling_unit) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }

  const doc = await PollingUnit.create(payload);
  return NextResponse.json({ data: doc }, { status: 201 });
}
