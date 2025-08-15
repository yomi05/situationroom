import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const user = await User.findById(session.user.id)
    .select('_id firstName lastName email phone gender disability state role emailVerified createdAt updatedAt')
    .lean();

  if (!user) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: user });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const payload = {
    firstName: body.firstName?.trim(),
    lastName: body.lastName?.trim(),
    phone: body.phone?.trim(),
    gender: body.gender,
    disability: !!body.disability,
    state: body.state,
  };

  // Basic validation
  const errors = {};
  if (!payload.firstName) errors.firstName = 'First name is required';
  if (!payload.lastName)  errors.lastName  = 'Last name is required';
  if (!payload.phone)     errors.phone     = 'Phone is required';
  else if (!/^\+?[0-9]{7,15}$/.test(payload.phone)) errors.phone = 'Enter a valid phone number';

  if (Object.keys(errors).length) {
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 422 });
  }

  await dbConnect();
  const updated = await User.findByIdAndUpdate(
    session.user.id,
    { $set: payload },
    { new: true, runValidators: true, select: '_id firstName lastName email phone gender disability state role emailVerified updatedAt' }
  ).lean();

  if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ message: 'Profile updated', data: updated });
}
