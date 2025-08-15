import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req) {
  try {
    await dbConnect();
    const { token, password, confirm } = await req.json();

    if (!token) return NextResponse.json({ message: 'Invalid token' }, { status: 422 });
    if (!password || password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 422 });
    }
    if (password !== confirm) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 422 });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    // Support new and legacy token fields
    const filter = {
      $or: [
        { resetPasswordToken: hash, resetPasswordExpires: { $gt: now } },
        { resetToken: hash, resetTokenExpires: { $gt: now } },
      ],
    };

    // Hash here (since we won't use pre-save)
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const result = await User.updateOne(
      filter,
      {
        $set: { password: hashed },
        $unset: {
          resetPasswordToken: '',
          resetPasswordExpires: '',
          resetToken: '',
          resetTokenExpires: '',
        },
      },
      { runValidators: false }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Token is invalid or expired' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (e) {
    console.error('Reset password error:', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
