import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendMail } from '@/lib/email/sendMail';

export async function POST(req) {
  try {
    await dbConnect();
    const { email } = await req.json();
    const normalized = (email || '').toLowerCase().trim();

    if (!normalized) {
      return NextResponse.json({ message: 'Email is required' }, { status: 422 });
    }

    // find but don't save the doc (avoid full validation later)
    const user = await User.findOne({ email: normalized }).select('_id email');

    // Always return generic success to avoid user enumeration
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    if (!user) {
      return NextResponse.json({ message: 'If that account exists, we sent an email' });
    }

    // Create token + expiry
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Atomic update (no full validation)
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          // new fields
          resetPasswordToken: hash,
          resetPasswordExpires: expires,
          // legacy compatibility
          resetToken: hash,
          resetTokenExpires: expires,
        },
      },
      { runValidators: false }
    );

    const resetUrl = `${baseUrl}/auth/reset-password/${raw}`;
    const subject = 'Reset your SituationRoom password';
    const text = `Reset your password: ${resetUrl}`;
    const html = `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}" target="_blank">Click here to reset</a> (valid for 30 minutes)</p>
      <p>If you didn’t request this, you can ignore this email.</p>
    `;

    await sendMail({ to: user.email, subject, text, html });

    const dev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({
      message: 'If that account exists, we sent an email',
      ...(dev && { devResetLink: resetUrl }), // helpful in dev
    });
  } catch (e) {
    console.error('Forgot password error:', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
