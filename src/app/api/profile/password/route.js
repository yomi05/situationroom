import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword, confirm } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Missing fields' }, { status: 422 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 422 });
  }
  if (newPassword !== confirm) {
    return NextResponse.json({ message: 'Passwords do not match' }, { status: 422 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select('+password');
  if (!user) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });

  // findByIdAndUpdate triggers pre('findOneAndUpdate') hashing in our model
  await User.findByIdAndUpdate(user._id, { $set: { password: newPassword } }, { runValidators: false });

  return NextResponse.json({ message: 'Password updated' });
}
